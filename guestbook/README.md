# 📖 Guestbook trên Kubernetes — Production-ready từ A → Z

Mini app **Guestbook**: nhập tên + lời nhắn, lưu vào backend.

- **Frontend**: ReactJS (Vite) → build static → serve bằng **nginx**, **2 replicas**.
- **Backend**: ExpressJS, lưu lời nhắn **in-memory**, **3 replicas**.
- **2 Service riêng biệt**: `backend-service` (ClusterIP, nội bộ) và `frontend-service` (NodePort, ra ngoài).
- Frontend gọi backend qua **DNS nội bộ** `http://backend-service:8080` (qua nginx proxy).
- **Zero-downtime**: rolling update v1 → v2, **rollback** nếu lỗi, backend **HA**.

---

## 0. Kiến trúc tổng quan

```
                    [ Trình duyệt user ]
                            │  http://<minikube-ip>:30080
                            ▼
                ┌───────────────────────────┐
                │  frontend-service (NodePort)│
                └───────────────────────────┘
                            │  (load balance)
              ┌─────────────┴─────────────┐
              ▼                           ▼
        [ frontend pod 1 ]          [ frontend pod 2 ]   ← React build + nginx (2 replicas)
        nginx: /api/ ──proxy──▶ http://backend-service:8080   (DNS NỘI BỘ)
              │                           │
              └─────────────┬─────────────┘
                            ▼
                ┌───────────────────────────┐
                │ backend-service (ClusterIP) │   ← chỉ gọi được TRONG cluster
                └───────────────────────────┘
                            │  (load balance)
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
   [ backend pod 1 ]  [ backend pod 2 ]  [ backend pod 3 ]   ← Express (3 replicas, HA)
```

### ⚠️ Bài học quan trọng nhất: DNS nội bộ hoạt động ở ĐÂU?

DNS `backend-service` **chỉ phân giải được BÊN TRONG cluster**. React chạy trong **trình duyệt** của user (ngoài cluster) nên **KHÔNG** gọi thẳng `http://backend-service:8080` được.

➡️ Cách đúng (production): React gọi đường dẫn tương đối `/api/messages`. **nginx trong pod frontend** (chạy bên trong cluster) mới là nơi proxy `/api/` sang `http://backend-service:8080`. Đây chính là chỗ DNS nội bộ được dùng đúng chuẩn.

### ⚠️ Bài học thứ hai: state in-memory + nhiều replica

Mỗi pod backend có RAM riêng. POST vào pod A → pod B **không** thấy lời nhắn đó. Vì auto-refresh load-balance qua nhiều pod, danh sách lời nhắn sẽ "nhấp nháy". **Đây là hành vi đúng để bạn quan sát**, và là lý do production phải dùng store dùng chung (Redis/Postgres) — xem [Phần 9](#9-len-production-that-su).

---

## 1. Yêu cầu & kiểm tra môi trường

```bash
kubectl version --client
minikube version
docker version
```

Khởi động minikube (nên cấp đủ tài nguyên):

```bash
minikube start --cpus=2 --memory=4096
minikube status
kubectl get nodes
```

Bật metrics-server (cần cho HPA — tùy chọn):

```bash
minikube addons enable metrics-server
```

---

## 2. Build images VÀO trong minikube

Vì code là của bạn (không có trên Docker Hub), phải tự build. Mẹo: trỏ Docker CLI vào **Docker daemon của chính minikube** để image nằm sẵn trong cluster, **không cần push registry**.

```bash
cd guestbook

# Trỏ docker vào minikube (chạy trong shell hiện tại)
eval $(minikube docker-env)

# Build backend v1 và v2 (cùng code, khác APP_VERSION)
docker build --build-arg APP_VERSION=v1 -t guestbook-backend:v1 ./backend
docker build --build-arg APP_VERSION=v2 -t guestbook-backend:v2 ./backend

# Build frontend
docker build -t guestbook-frontend:v1 ./frontend

# Kiểm tra image đã nằm trong minikube
docker images | grep guestbook
```

> Hoặc nhanh hơn: `make build` (sau khi đã `eval $(minikube docker-env)`).

> Vì image là local nên các Deployment dùng `imagePullPolicy: IfNotPresent` để K8s **không** đi pull từ Docker Hub.

### ⚠️ Gotcha 1: Docker cài bằng snap → `eval $(minikube docker-env)` lỗi cert

Nếu `docker` của bạn là bản **snap** (`which docker` ra `/snap/bin/docker`), snap bị giới hạn không đọc được thư mục ẩn `~/.minikube`, gây lỗi:

```
ERROR: open /home/<user>/.minikube/certs/ca.pem: permission denied
```

**Cách xử lý**: copy cert ra thư mục KHÔNG ẩn rồi trỏ `DOCKER_CERT_PATH` vào đó:

```bash
mkdir -p ~/minikube-certs
cp ~/.minikube/certs/{ca,cert,key}.pem ~/minikube-certs/

export DOCKER_TLS_VERIFY=1
export DOCKER_HOST=$(minikube ip | sed 's#.*#tcp://&:2376#')
export DOCKER_CERT_PATH=~/minikube-certs

docker build --build-arg APP_VERSION=v1 -t guestbook-backend:v1 ./backend
# ... (build v2 và frontend tương tự)
```


---

## 3. Deploy toàn bộ hệ thống

```bash
kubectl apply -f k8s/
```

Lệnh này tạo: namespace, backend Deployment (3 replicas) + Service + PDB + HPA, frontend Deployment (2 replicas) + Service + PDB.

> ### ⚠️ Gotcha 2: `runAsNonRoot` + user dạng tên
> Backend chạy bằng user `node` (dạng tên, không phải số). Khi bật `runAsNonRoot: true`, K8s cần **UID dạng số** để xác minh không phải root, nếu không pod báo `CreateContainerConfigError`. Vì vậy manifest đã set thêm `runAsUser: 1000` (chính là UID của user `node`).

> ### ⚠️ Gotcha 3: xóa/scale pod vẫn rớt vài request nếu thiếu `preStop`
> Khi pod bị xóa, K8s **đồng thời** gửi SIGTERM cho container **và** gỡ pod khỏi Service endpoints (qua kube-proxy) — nhưng hai việc này **bất đồng bộ**. Nếu app đóng server ngay khi nhận SIGTERM, sẽ có request vẫn bị route vào pod đang tắt → lỗi connection (đo thực tế: vài request `code=000` khi xóa 2 pod cùng lúc).
>
> **Cách xử lý** (đã thêm vào backend): `preStop` hook `sleep 5` — pod tiếp tục phục vụ thêm 5s để kube-proxy kịp gỡ endpoint, **rồi** mới nhận SIGTERM. Sau khi thêm: xóa 2 pod cùng lúc → **0 request lỗi**.
> ```yaml
> lifecycle:
>   preStop:
>     exec:
>       command: ["sleep", "5"]
> ```

Theo dõi đến khi tất cả `Running` và `READY`:

```bash
kubectl get pods -n guestbook -w
```

Xem tổng thể:

```bash
kubectl get all,pdb,hpa -n guestbook -o wide
```

---

## 4. Truy cập ứng dụng

```bash
minikube service frontend-service -n guestbook --url
```

Mở URL in ra (vd `http://192.168.49.2:30080`) bằng trình duyệt → nhập tên + lời nhắn → **Gửi**.

Quan sát dòng badge: *"backend version: v1 | trả lời bởi pod: backend-xxxx"* — pod đổi liên tục → đó là **load balancing** của Service.

Kiểm tra nhanh API từ trong cluster:

```bash
kubectl run curl --rm -it --image=curlimages/curl -n guestbook --restart=Never -- \
  curl -s http://backend-service:8080/messages
```

---

## 5. Rolling update backend v1 → v2 (ZERO-DOWNTIME)

Cấu hình `strategy` của backend đảm bảo zero-downtime:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1        # tạo thêm tối đa 1 pod mới
    maxUnavailable: 0  # KHÔNG để thiếu pod nào → luôn đủ pod phục vụ
```

Cộng với `readinessProbe`: pod mới chỉ nhận traffic **sau khi** `/readyz` OK. Pod cũ chỉ bị xóa **sau khi** pod mới đã ready.

Mở 1 terminal theo dõi:

```bash
kubectl get pods -n guestbook -w
```

Terminal khác — thực hiện update:

```bash
kubectl set image deployment/backend backend=guestbook-backend:v2 -n guestbook
kubectl rollout status deployment/backend -n guestbook
```

Trong lúc roll, refresh trang web — **không bị lỗi**, badge dần chuyển từ `v1` sang `v2`. Đó là zero-downtime.

Kiểm chứng version đang chạy:

```bash
kubectl get pods -n guestbook -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[0].image}{"\n"}{end}'
```

---

## 6. Scale backend lên 5 replicas

```bash
kubectl scale deployment/backend --replicas=5 -n guestbook
kubectl get pods -n guestbook -w
```

> Nếu bật HPA, nó tự scale 3→10 theo CPU. Khi tự scale tay đè HPA, HPA vẫn có thể chỉnh lại theo tải — bình thường ở môi trường học.

---

## 7. Rollback về v1 khi v2 lỗi

### 7a. Giả lập v2 LỖI (readiness fail)

Ta mô phỏng một bản v2 hỏng: `/readyz` trả 503 → pod mới **không bao giờ ready**.

```bash
kubectl set image deployment/backend backend=guestbook-backend:v2 -n guestbook
kubectl set env deployment/backend FAIL_READINESS=true -n guestbook
```

Quan sát:

```bash
kubectl get pods -n guestbook -w
kubectl rollout status deployment/backend -n guestbook   # sẽ "treo", không hoàn tất
```

➡️ Vì `maxUnavailable: 0`, các pod **v1 cũ vẫn chạy và phục vụ** — web **vẫn sống**. Pod v2 mới kẹt ở `Running` nhưng `0/1 READY` → Service không route vào. **Đây chính là cơ chế bảo vệ zero-downtime: bản lỗi không bao giờ nhận traffic.**

### 7b. Rollback

```bash
kubectl rollout history deployment/backend -n guestbook      # xem các revision
kubectl rollout undo deployment/backend -n guestbook         # quay về revision trước
# hoặc về revision cụ thể:
# kubectl rollout undo deployment/backend --to-revision=1 -n guestbook
kubectl rollout status deployment/backend -n guestbook
```

Dọn biến môi trường giả lập lỗi (nếu cần thử lại bản v2 tốt):

```bash
kubectl set env deployment/backend FAIL_READINESS- -n guestbook
```

> Tip: `kubectl rollout pause/resume deployment/backend` để tạm dừng quá trình roll giữa chừng khi soi.

---

## 8. Xóa ngẫu nhiên pod & quan sát tự phục hồi (self-healing)

Deployment → ReplicaSet luôn cố giữ đúng số replica. Xóa pod, K8s tạo lại ngay.

```bash
# Xem pod
kubectl get pods -n guestbook

# Xóa 1 pod backend bất kỳ
kubectl delete pod -n guestbook \
  $(kubectl get pods -n guestbook -l app.kubernetes.io/component=backend -o name | head -n1)

# Quan sát pod mới được tạo lại tự động
kubectl get pods -n guestbook -w
```

Trong lúc đó web vẫn chạy vì còn các pod khác (HA). `PodDisruptionBudget` (`minAvailable: 2`) đảm bảo khi *drain node* cũng luôn còn ≥ 2 pod backend.

---

## 9. Lên production thật sự

Những gì repo này đã có (production-ready cơ bản):

- ✅ Resource `requests`/`limits`, `readiness`/`liveness`/`startup` probes
- ✅ Rolling update `maxUnavailable: 0` → zero-downtime, `rollout undo` → rollback
- ✅ HA: nhiều replica + `PodDisruptionBudget` + `topologySpreadConstraints`
- ✅ Graceful shutdown (SIGTERM) + `preStop` hook (tránh rớt request khi xóa/scale pod), `securityContext` chặt
- ✅ HPA tự co giãn theo tải

Cần bổ sung khi lên prod thật:

- 🔸 **State dùng chung**: thay in-memory bằng **Redis/Postgres** (StatefulSet hoặc managed DB) để mọi pod thấy chung dữ liệu.
- 🔸 **Ingress + TLS** (nginx-ingress / cert-manager) thay cho NodePort; trên cloud dùng LoadBalancer.
- 🔸 **Image registry** thật (ECR/GCR/Docker Hub) + tag theo git SHA, quét bảo mật.
- 🔸 **Config/Secret** qua ConfigMap/Secret (không hard-code).
- 🔸 **Observability**: Prometheus + Grafana, log tập trung (Loki/ELK), tracing.
- 🔸 **GitOps**: ArgoCD/Flux; hoặc đóng gói bằng **Helm/Kustomize**.

---

## 10. Dọn dẹp

```bash
kubectl delete namespace guestbook     # xóa toàn bộ
# hoặc: make clean
```

---

## Phụ lục: Bảng lệnh nhanh (Makefile)

| Lệnh | Tác dụng |
|------|----------|
| `make build` | Build cả 3 image (backend v1, v2, frontend) |
| `make deploy` | `kubectl apply -f k8s/` |
| `make status` | Xem all + pdb + hpa |
| `make url` | Lấy URL frontend |
| `make update-v2` | Rolling update backend lên v2 |
| `make scale-5` | Scale backend lên 5 replicas |
| `make break-v2` | Giả lập v2 lỗi (readiness fail) |
| `make rollback` | Rollback backend |
| `make history` | Xem rollout history |
| `make clean` | Xóa namespace guestbook |

> Nhớ chạy `eval $(minikube docker-env)` **trước** `make build`.

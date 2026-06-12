# Kubernetes Cluster Architecture

## Tổng quan

Kubernetes (K8s) là một nền tảng điều phối container (container orchestration platform) giúp tự động triển khai, quản lý và mở rộng các ứng dụng chạy dưới dạng container.

Một Kubernetes Cluster bao gồm hai thành phần chính:

* **Control Plane**
* **Worker Nodes (Data Plane)**

```text
+------------------------------------------------------+
|                  Kubernetes Cluster                  |
|                                                      |
|  +----------------+     +------------------------+  |
|  | Control Plane  |     |     Worker Nodes       |  |
|  | (Master Node)  |     |    (Data Plane)        |  |
|  +----------------+     +------------------------+  |
+------------------------------------------------------+
```

---

## 1. Control Plane

Control Plane là "bộ não" của Kubernetes Cluster. Nó chịu trách nhiệm quản lý toàn bộ trạng thái của hệ thống và quyết định việc triển khai workload lên các Worker Node.

### Các thành phần chính của Control Plane

### 1.1. kube-apiserver

`kube-apiserver` là cổng giao tiếp trung tâm của Kubernetes.

Nhiệm vụ:

* Nhận yêu cầu từ người quản trị (kubectl, API Client,...)
* Xác thực và kiểm tra quyền truy cập
* Cập nhật trạng thái cluster
* Giao tiếp với các thành phần khác của Control Plane

```text
Admin
   │
   ▼
kube-apiserver
```

---

### 1.2. etcd

`etcd` là cơ sở dữ liệu dạng Key-Value được Kubernetes sử dụng.

Nhiệm vụ:

* Lưu trữ toàn bộ trạng thái của Cluster.
* Lưu thông tin về:

  * Pod
  * Node
  * Service
  * ConfigMap
  * Secret
  * ReplicaSet
  * Deployment
  * ...

Ví dụ:

```text
Pod/payment -> Running
Node/worker-1 -> Ready
Deployment/user -> 3 replicas
```

> etcd là thành phần cực kỳ quan trọng. Nếu mất dữ liệu etcd, Cluster gần như mất toàn bộ trạng thái.

---

### 1.3. kube-scheduler

`kube-scheduler` quyết định Pod sẽ được chạy trên Worker Node nào.

Nhiệm vụ:

* Theo dõi các Pod chưa được gán Node.
* Phân tích tài nguyên của các Node.
* Chọn Node phù hợp nhất.

Ví dụ:

```text
Có 2 Worker Nodes:

Worker-1
CPU: 90%

Worker-2
CPU: 20%

→ Scheduler sẽ chọn Worker-2.
```

Lưu ý:

> Scheduler không giao tiếp trực tiếp với Worker Node, mà luôn thông qua kube-apiserver.

---

### 1.4. kube-controller-manager

Controller Manager giúp duy trì trạng thái mong muốn (Desired State) của hệ thống.

Ví dụ:

Deployment yêu cầu:

```yaml
replicas: 5
```

Nếu một Pod bị chết:

```text
Thực tế: 4 Pods
Mong muốn: 5 Pods
```

Controller Manager sẽ phát hiện sự khác biệt và tạo thêm Pod mới.

Nó quản lý nhiều loại controller như:

* Deployment Controller
* ReplicaSet Controller
* Node Controller
* Endpoint Controller
* Job Controller
* ...

---

### 1.5. cloud-controller-manager

Thành phần này hỗ trợ Kubernetes tích hợp với các Cloud Provider.

Ví dụ:

* AWS
* Azure
* Google Cloud

Nhiệm vụ:

* Tạo Load Balancer
* Quản lý Volume
* Quản lý Node
* Đồng bộ tài nguyên Cloud

Nếu triển khai Kubernetes On-Premise, thành phần này có thể không cần thiết.

---

## 2. Worker Nodes (Data Plane)

Worker Node là nơi chạy ứng dụng thực tế của chúng ta.

Thông thường, ứng dụng sẽ được triển khai trên Worker Node thay vì Control Plane.

```text
Worker-1
 ├─ Pod User Service
 └─ Pod Payment Service

Worker-2
 ├─ Pod Customer Service
 └─ Pod Notification Service
```

---

## Các thành phần của Worker Node

### 2.1. kubelet

`kubelet` là tác nhân quản lý Node.

Nhiệm vụ:

* Nhận chỉ thị từ kube-apiserver.
* Tạo và quản lý Pod.
* Giám sát Pod.
* Báo cáo trạng thái Node và Pod về Control Plane.

```text
kube-apiserver
        │
        ▼
     kubelet
        │
        ▼
      Pods
```

Có thể xem kubelet như:

> "Người quản lý" của một Worker Node.

---

### 2.2. kube-proxy

`kube-proxy` chịu trách nhiệm xử lý networking bên trong Cluster.

Nhiệm vụ:

* Quản lý luật mạng.
* Định tuyến lưu lượng.
* Hỗ trợ Service Discovery.
* Cân bằng tải giữa các Pod.

Ví dụ:

```text
Client
   │
   ▼
Service
   │
 ┌─┴─────┐
 ▼       ▼
Pod A   Pod B
```

kube-proxy sẽ quyết định request được chuyển đến Pod nào.

---

### 2.3. Container Runtime

Container Runtime là thành phần thực sự chạy container.

Ví dụ:

* containerd
* CRI-O
* Docker (thông qua CRI)

Nhiệm vụ:

* Pull Image
* Start Container
* Stop Container
* Theo dõi vòng đời Container

```text
Pod
 │
 ▼
Container Runtime
 │
 ▼
Containers
```

Kubernetes giao tiếp với Runtime thông qua chuẩn:

```text
CRI (Container Runtime Interface)
```

Điều này giúp Kubernetes hỗ trợ nhiều Runtime khác nhau.

---

## Pod là gì?

Pod là đơn vị triển khai nhỏ nhất trong Kubernetes.

Một Pod có thể chứa:

* Một container.
* Hoặc nhiều container có liên quan.

Ví dụ:

```text
Pod
├─ Application Container
└─ Sidecar Container
```

Trong thực tế:

> Phần lớn các ứng dụng sử dụng mô hình "1 Pod = 1 Container".

---

## Luồng triển khai Pod trong Kubernetes

Khi Admin triển khai ứng dụng:

### Bước 1

Admin gửi yêu cầu:

```text
kubectl apply -f deployment.yaml
```

↓

### Bước 2

`kube-apiserver` nhận yêu cầu.

↓

### Bước 3

Thông tin được lưu vào `etcd`.

↓

### Bước 4

`kube-scheduler` chọn Worker Node phù hợp.

↓

### Bước 5

`kube-apiserver` gửi chỉ thị tới `kubelet`.

↓

### Bước 6

`kubelet` yêu cầu Container Runtime tạo Pod.

↓

### Bước 7

Pod được khởi chạy.

↓

### Bước 8

`kubelet` liên tục báo cáo trạng thái về Control Plane.

---

## Kiến trúc tổng quát

```text
                    +----------------------+
                    |       Admin          |
                    |      kubectl         |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |   kube-apiserver     |
                    +----------+-----------+
                               |
       +-----------------------+-----------------------+
       |                       |                       |
       v                       v                       v
+-------------+       +----------------+     +-------------------+
|    etcd     |       | kube-scheduler |     | controller-manager|
+-------------+       +----------------+     +-------------------+
                               |
                               v
                  +-------------------------+
                  |      Worker Nodes       |
                  +-------------------------+
                    |                    |
                    v                    v
             +------------+      +------------+
             | kubelet    |      | kubelet    |
             | kube-proxy |      | kube-proxy |
             +------+-----+      +------+-----+
                    |                   |
                    v                   v
                 Pods                Pods
```

---

## Tổng kết

Một Kubernetes Cluster được chia thành hai phần chính:

### Control Plane

Chịu trách nhiệm quản lý Cluster.

Bao gồm:

* kube-apiserver
* etcd
* kube-scheduler
* kube-controller-manager
* cloud-controller-manager

### Worker Nodes (Data Plane)

Chịu trách nhiệm chạy ứng dụng.

Bao gồm:

* kubelet
* kube-proxy
* Container Runtime
* Pods

Hiểu được kiến trúc Cluster là nền tảng quan trọng để học sâu hơn về Kubernetes như:

* Pod
* Deployment
* ReplicaSet
* Service
* Ingress
* ConfigMap
* Secret
* Volume
* Networking
* Autoscaling
* Monitoring
* Security
* CKA/CKAD Certification

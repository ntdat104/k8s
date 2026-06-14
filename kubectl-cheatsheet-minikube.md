# Kubectl Cheat Sheet (Minikube)

## 0. Kiem tra verion

``` bash
# Kiem tra verion cua k8s
kubectl version --client

# Kiem tra verion cua minikube
minikube version

# Khởi động Minikube
minikube start

# Kiểm tra trạng thái
minikube status

# Xem pod voi tat ca namespace
kubectl get pods -A # Hoặc: kubectl get po -A

# Xem node
kubectl get nodes

# Xem pod voi default namespace
kubectl get pods # Hoac: kubectl get po

# Chay 1 pod voi ten la app1 va image la image tren dockerhub, vietaws/eks (ubuntu), vietaws/arm (macos chip M)
kubectl run app1 --image=vietaws/eks:v1

# Mornitor trang thai pods chay
kubectl get pods --watch # Hoac: kubectl get pods -w

# Xem thong tin cua pods
kubectl describe pods app1

# Trong truong hop minh update version o tren dockerhub thi khi chay mot cai image thi minh phai them '--image-pull-policy Always'
kubectl run --image=vietaws/eks:v1 --image-pull-policy Always

# Co 2 cach de expose port cua pods ra ben ngoai: NodePort va LoadBalancer. LoadBalancer dung trong cong cu cloud provider ELP, con NodePort thi expose dang node theo dai port 30,000 -> 32,767 (random)

# De muon goi tu ung dung ben ngoai vao trong noi bo cluster thi phai tao 1 cai service (svc)
kubectl get services # Hoac kubectl get svc

# Muon expose ra ben ngoai thi dung
kubectl expose --help
kubectl expose service nginx --port=443 --target-port=8443 --name=nginx-https
kubectl expose pods app1 --port=8081 --target-port=8080 --name=service1 --type=NodePort
kubectl get svc

# Xem thong tin chi tiet cua mot cai port
kubectl describe svc service1
kubectl get svc
kubectl get nodes
kubectl get nodes -o wide # Xem thong tin chi tiet

# Expose port ra ben ngoai (minikube)
minikube service service1 --url

kubectl describe pods app1
kubectl get svc

# Xem log cua pods
kubectl logs app1
kubectl logs app1 -f

# Trong truong hop 1 pod co nhieu container thi phai dung cu phap khac
kubectl logs app1 -c app1 log1 -f

# Kiem thu chui vao pods va container (exec)
kubectl exec -it app1 -- ls
kubectl exec -it app1 -- cat index.js
kubectl exec -it app1 -- sh

# Imperative vs Declarative (Imperative la go tung lenh 1, Declarative dung file yml)
kubectl apply -f pod.yml
kubectl get pods -w
kubectl describe pods simple-app

# ReplicaSet: Dinh nghia toi muon chay 1 nhom cac con pod, voi so luong la replicas: 3
kubectl get pods
kubectl get replicasets.apps # Hoac kubectl get rs

kubectl apply -f replicaset-rs.yml
kubectl get rs
kubectl delete -f replicaset-rs.yml # Hoac kubectl delete rs rs3
kubectl get po

kubectl describe replicasets.apps rs3
kubectl describe rs rs3

kubectl get pods
kubectl delete pod rs3-nhgjq # Sau khi xoa 1 pod thi tu dong tao 1 con pod moi

kubectl get svc
kubectl get rs
kubectl delete rs rs3

# ReplicaSet: Hieu ra cach dung selector
kubectl run app3-manual --image vietaws/eks:v3 --labels="app=app3,env=prod"
kubectl get pods
kubectl describe pods app3-manual
kubectl apply -f replicaset-rs.yml
kubectl get rs
kubectl get pods

# Expose ReplicaSet Imperative
kubectl get pods
kubectl get rs
kubectl get svc
kubectl expose rs rs3 --name=service3 --type=NodePort --port=8080
kubectl get svc
kubectl get nodes -o wide
minikube service service3 --url

# Expose ReplicaSet Declarative
kubectl get svc
kubectl apply -f nodeport.yml
kubectl get svc
minikube service service3-declarative --url
kubectl get pods

# Edit ReplicaSet và Giới Thiệu Deployment
kubectl get src
kubectl edit rs rs3 # thay doi image:v3 -> image:v4 thi phai xoa pods cu di, con thay doi replica 3 -> 4 thi khong can xoa
kubectl get po

kubectl get pods
kubectl delete pods rs3-9rks9 rs3-pknww rs3-w8zrv app3-manual
kubectl get pods
kubectl describe pods rs3-4gt82
kubectl get svc
minikube service service3-declarative --url

# Create Deployment Imperative
kubectl delete rs rs3
kubectl get rs
kubectl get pods
kubectl delete pod app1 simple-app
kubectl get pods
kubectl get svc
kubectl delete svc service1 service3 service3-declarative
kubectl get svc

kubectl create deployment --help
kubectl create deploy app1-deploy --image vietaws/eks:v1 --port 8080 # Hoac kubectl create deployment app1-deploy --image vietaws/eks:v1 --port 8080
kubectl get deployment
kubectl get svc
kubectl get rs
kubectl get pods
kubectl describe pod app1-deploy-9686c96f9-qrh5c

# Create Deployment Declarative
kubectl apply -f deploy1.yml
kubectl get pods
kubectl get rs
kubectl get deploy
kubectl describe deployment nginx-deployment
kubectl get deployment
kubectl get svc
kubectl get rs
kubectl expose deployment app1-deploy --type=NodePort --port=8080 --target-port=8080
kubectl get svc
kubectl expose deployment nginx-deployment --type=NodePort --port=8081 --target-port=8080
kubectl get svc
minikube service app1-deploy --url
minikube service nginx-deployment --url
```

## 1. Minikube

``` bash
# Khởi động Minikube
minikube start

# Kiểm tra trạng thái
minikube status

# Dừng Minikube
minikube stop

# Xóa cluster
minikube delete

# Dashboard
minikube dashboard
```

## 2. Cluster

``` bash
# Xem thông tin cluster
kubectl cluster-info

# Kiểm tra version
kubectl version

# Xem context hiện tại
kubectl config current-context

# Xem các context
kubectl config get-contexts

# Chuyển context
kubectl config use-context minikube
```

## 3. Namespace

``` bash
# Xem namespace
kubectl get namespaces # Hoặc: kubectl get ns

# Tạo namespace
kubectl create namespace dev

# Xóa namespace
kubectl delete namespace dev

# Chạy lệnh trên namespace cụ thể
kubectl get pods -n dev

# Đặt namespace mặc định
kubectl config set-context --current --namespace=dev
```

## 4. Pods

``` bash
# Xem pod
kubectl get pods # Hoặc: kubectl get po

# Xem chi tiết
kubectl get pods -o wide

# Theo dõi realtime
kubectl get pods -w

# Mô tả pod
kubectl describe pod <pod-name>

# Xóa pod
kubectl delete pod <pod-name>

# Vào shell của pod
kubectl exec -it <pod-name> -- sh # Hoặc: kubectl exec -it <pod-name> -- bash
```

## 5. Deployment

``` bash
# Xem deployment
kubectl get deployments # Hoặc: kubectl get deploy

# Tạo deployment nhanh
kubectl create deployment nginx --image=nginx

# Mô tả deployment
kubectl describe deployment nginx

# Scale
kubectl scale deployment nginx --replicas=3

# Xóa
kubectl delete deployment nginx
```

## 6. Apply YAML

``` bash
# Áp dụng manifest
kubectl apply -f deployment.yaml

# Áp dụng thư mục
kubectl apply -f manifests/

# Xóa theo YAML
kubectl delete -f deployment.yaml

# Xem sự khác biệt trước khi apply
kubectl diff -f deployment.yaml
```

## 7. Service

``` bash
# Xem danh sách service
kubectl get svc

# Expose deployment thành service kiểu NodePort
kubectl expose deployment nginx --type=NodePort --port=80

# Mô tả chi tiết service
kubectl describe svc nginx

# Xóa service
kubectl delete svc nginx

# Lấy URL truy cập service qua Minikube
minikube service nginx --url
```

## 8. Logs

``` bash
# Xem log của pod
kubectl logs <pod-name>

# Theo dõi log realtime
kubectl logs -f <pod-name>

# Xem log của container cụ thể trong pod (multi-container)
kubectl logs <pod-name> -c <container-name>

# Xem log của lần chạy trước (khi pod bị restart)
kubectl logs --previous <pod-name>
```

## 9. Rollout

``` bash
# Kiểm tra trạng thái rollout
kubectl rollout status deployment/nginx

# Xem lịch sử rollout
kubectl rollout history deployment/nginx

# Khởi động lại deployment (rolling restart)
kubectl rollout restart deployment/nginx

# Rollback về phiên bản trước
kubectl rollout undo deployment/nginx

# Rollback về revision cụ thể
kubectl rollout undo deployment/nginx --to-revision=2
```

## 10. Update Image

``` bash
# Cập nhật image của container trong deployment
kubectl set image deployment/nginx nginx=nginx:1.27

# Kiểm tra trạng thái sau khi update
kubectl rollout status deployment/nginx
```

## 11. ConfigMap & Secret

``` bash
# Xem danh sách ConfigMap
kubectl get configmaps

# Xem danh sách Secret
kubectl get secrets

# Tạo ConfigMap từ giá trị trực tiếp
kubectl create configmap app-config --from-literal=ENV=dev

# Tạo Secret từ giá trị trực tiếp
kubectl create secret generic db-secret --from-literal=password=123456

# Mô tả chi tiết ConfigMap
kubectl describe configmap app-config

# Mô tả chi tiết Secret
kubectl describe secret db-secret
```

## 12. Port Forward

``` bash
# Forward cổng từ pod về máy local
kubectl port-forward pod/<pod-name> 8080:80

# Forward cổng từ deployment về máy local
kubectl port-forward deployment/nginx 8080:80

# Forward cổng từ service về máy local
kubectl port-forward svc/nginx 8080:80
```

## 13. Debug

``` bash
# Xem các sự kiện trong cluster
kubectl get events

# Xem events sắp xếp theo thời gian
kubectl get events --sort-by=.metadata.creationTimestamp

# Xem tất cả resource trong namespace hiện tại
kubectl get all

# Xuất cấu hình pod dạng YAML
kubectl get pod <pod-name> -o yaml

# Xuất cấu hình pod dạng JSON
kubectl get pod <pod-name> -o json
```

## 14. Edit Resource

``` bash
# Chỉnh sửa trực tiếp cấu hình deployment trên cluster
kubectl edit deployment nginx
```

## 15. API Resources

``` bash
# Liệt kê tất cả loại resource trong cluster
kubectl api-resources

# Liệt kê các API version được hỗ trợ
kubectl api-versions

# Xem tài liệu về resource deployment
kubectl explain deployment

# Xem tài liệu về trường spec của deployment
kubectl explain deployment.spec
```

## 16. Most Used Commands

``` bash
# Xem danh sách pods/services/deployments
kubectl get pods
kubectl get svc
kubectl get deploy

# Debug pod
kubectl describe pod <pod>
kubectl logs -f <pod>
kubectl exec -it <pod> -- sh

# Áp dụng / xóa manifest YAML
kubectl apply -f xxx.yaml
kubectl delete -f xxx.yaml

# Restart và scale deployment
kubectl rollout restart deployment/<name>
kubectl scale deployment/<name> --replicas=3

# Truy cập service từ máy local
kubectl port-forward svc/<name> 8080:80

# Kiểm tra sự kiện và toàn bộ resource
kubectl get events
kubectl get all
```

## Suggested Learning Path

1.  Pod
2.  Deployment
3.  Service
4.  ConfigMap & Secret
5.  Liveness/Readiness Probe
6.  Volume & PersistentVolume
7.  Ingress
8.  Rollout & Rollback
9.  Debugging
10. Practice on K3s or Cloud Kubernetes

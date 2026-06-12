# Kubectl Cheat Sheet (Minikube)

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

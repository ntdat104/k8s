# ============================================================
# Makefile tien ich cho Guestbook tren minikube
# Dung: make <target>
# ============================================================

NS := guestbook

# Tro Docker CLI vao Docker daemon CUA minikube
# -> image build se nam SAN trong cluster, khong can push registry
.PHONY: env
env:
	@echo "Chay lenh sau trong shell cua ban:"
	@echo '  eval $$(minikube docker-env)'

# ---------- BUILD IMAGES (chay sau khi da: eval $(minikube docker-env)) ----------
.PHONY: build-backend-v1
build-backend-v1:
	docker build --build-arg APP_VERSION=v1 -t guestbook-backend:v1 ./backend

.PHONY: build-backend-v2
build-backend-v2:
	docker build --build-arg APP_VERSION=v2 -t guestbook-backend:v2 ./backend

.PHONY: build-frontend
build-frontend:
	docker build -t guestbook-frontend:v1 ./frontend

.PHONY: build
build: build-backend-v1 build-backend-v2 build-frontend

# ---------- DEPLOY ----------
.PHONY: deploy
deploy:
	kubectl apply -f k8s/

.PHONY: status
status:
	kubectl get all,pdb,hpa -n $(NS) -o wide

.PHONY: watch
watch:
	kubectl get pods -n $(NS) -w

.PHONY: url
url:
	minikube service frontend-service -n $(NS) --url

# ---------- ROLLING UPDATE / ROLLBACK ----------
.PHONY: update-v2
update-v2:
	kubectl set image deployment/backend backend=guestbook-backend:v2 -n $(NS)
	kubectl rollout status deployment/backend -n $(NS)

.PHONY: scale-5
scale-5:
	kubectl scale deployment/backend --replicas=5 -n $(NS)

.PHONY: rollback
rollback:
	kubectl rollout undo deployment/backend -n $(NS)
	kubectl rollout status deployment/backend -n $(NS)

.PHONY: history
history:
	kubectl rollout history deployment/backend -n $(NS)

# Gia lap v2 LOI (readiness fail) de luyen tap rollback
.PHONY: break-v2
break-v2:
	kubectl set image deployment/backend backend=guestbook-backend:v2 -n $(NS)
	kubectl set env deployment/backend FAIL_READINESS=true -n $(NS)

.PHONY: unbreak
unbreak:
	kubectl set env deployment/backend FAIL_READINESS- -n $(NS)

# ---------- CLEANUP ----------
.PHONY: clean
clean:
	kubectl delete namespace $(NS)

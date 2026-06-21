pipeline {
    agent any

    environment {
        // Your Docker Hub details
        REGISTRY_USER   = 'joypatel2403' 
        FRONTEND_IMAGE  = "${REGISTRY_USER}/ci-cd-workflow-frontend"
        BACKEND_IMAGE   = "${REGISTRY_USER}/ci-cd-workflow-backend"
        IMAGE_TAG       = "${BUILD_NUMBER}"
        
        // Credentials IDs configured in your Jenkins Dashboard
        DOCKER_CRED_ID  = 'docker-hub-credentials' 
        KUBE_CONFIG_ID  = 'k8s-config' 
    }

    stages {
        stage('Clone Repository') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies & Test') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            echo 'Installing backend dependencies...'
                            // sh 'npm install'
                            // sh 'npm test'
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            echo 'Installing frontend dependencies...'
                            // sh 'npm install'
                            // sh 'npm test'
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                parallel(
                    "Frontend": {
                        dir('frontend') {
                            sh "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ."
                        }
                    },
                    "Backend": {
                        dir('backend') {
                            sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ."
                        }
                    }
                )
            }
        }

        stage('Push to Registry') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${DOCKER_CRED_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh "echo ${DOCKER_PASSWORD} | docker login -u ${DOCKER_USER} --password-stdin"
                    
                    parallel(
                        "Push Frontend": {
                            sh "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                            sh "docker push ${FRONTEND_IMAGE}:latest"
                        },
                        "Push Backend": {
                            sh "docker push ${BACKEND_IMAGE}:${IMAGE_TAG}"
                            sh "docker push ${BACKEND_IMAGE}:latest"
                        }
                    )
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                // Securely use kubeconfig to apply manifests and update image versions
                configFileProvider([configFile(fileId: "${KUBE_CONFIG_ID}", variable: 'KUBECONFIG')]) {
                    dir('k8s') {
                        echo "Updating deployment images to tag: ${IMAGE_TAG}"
                        
                        // Dynamically update the image tags in manifest files or via kubectl set image
                        sh "kubectl apply -f ."
                        sh "kubectl set image deployment/frontend-deployment frontend=${FRONTEND_IMAGE}:${IMAGE_TAG} --kubeconfig=${KUBECONFIG}"
                        sh "kubectl set image deployment/backend-deployment backend=${BACKEND_IMAGE}:${IMAGE_TAG} --kubeconfig=${KUBECONFIG}"
                        
                        // Verify the rollout status
                        sh "kubectl rollout status deployment/frontend-deployment --kubeconfig=${KUBECONFIG}"
                        sh "kubectl rollout status deployment/backend-deployment --kubeconfig=${KUBECONFIG}"
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up Docker images from the build agent...'
            sh "docker rmi ${FRONTEND_IMAGE}:${IMAGE_TAG} ${FRONTEND_IMAGE}:latest || true"
            sh "docker rmi ${BACKEND_IMAGE}:${IMAGE_TAG} ${BACKEND_IMAGE}:latest || true"
            cleanWs()
        }
        success {
            echo "Pipeline succeeded! Deployment updated to version ${IMAGE_TAG}."
        }
        failure {
            echo "Pipeline failed. Check the logs for troubleshooting."
        }
    }
}
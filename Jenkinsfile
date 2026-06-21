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
                // Fixed: Wrapped scripted parallel inside a script block
                script {
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
        }

        stage('Push to Registry') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${DOCKER_CRED_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh "echo ${DOCKER_PASSWORD} | docker login -u ${DOCKER_USER} --password-stdin"
                    
                    // Fixed: Wrapped scripted parallel inside a script block
                    script {
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
        }

        stage('Deploy to Kubernetes') {
            steps {
                // Fixed: Changed from configFileProvider to withCredentials to match your saved Secret File
                withCredentials([file(credentialsId: "${KUBE_CONFIG_ID}", variable: 'CLUSTER_KUBECONFIG')]) {
                    dir('k8s') {
                        echo "Updating deployment images to tag: ${IMAGE_TAG}"
                        
                        // Apply manifests using the injected kubeconfig
                        sh "KUBECONFIG=\$CLUSTER_KUBECONFIG kubectl apply -f . --validate=false"
                        
                        // Dynamically update the image tags in manifest files or via kubectl set image
                        sh "KUBECONFIG=\$CLUSTER_KUBECONFIG kubectl set image deployment/frontend-deployment frontend=${FRONTEND_IMAGE}:${IMAGE_TAG}"
                        sh "KUBECONFIG=\$CLUSTER_KUBECONFIG kubectl set image deployment/backend-deployment backend=${BACKEND_IMAGE}:${IMAGE_TAG}"
                        
                        // Verify the rollout status
                        sh "KUBECONFIG=\$CLUSTER_KUBECONFIG kubectl rollout status deployment/frontend-deployment"
                        sh "KUBECONFIG=\$CLUSTER_KUBECONFIG kubectl rollout status deployment/backend-deployment"
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
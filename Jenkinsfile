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
        // UPDATED: Points to your new Secret Text credential ID
        KUBE_TOKEN_ID   = 'kubectl-token' 
        // Run 'minikube ip' in your terminal and update this if your Minikube IP changed
        KUBE_API_SERVER = 'https://192.168.49.2:8443' 
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
                script {
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_CRED_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASSWORD')]) {
                              sh "echo ${DOCKER_PASSWORD} | docker login -u ${DOCKER_USER} --password-stdin"
                    parallel(
                        "Frontend": {
                            script {
                                dir('frontend') {
                                    if (fileExists('Dockerfile')) {
                                        sh "docker build -f Dockerfile -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ."
                                    } else if (fileExists('dockerfile')) {
                                        sh "docker build -f dockerfile -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ."
                                    } else {
                                        echo "Dockerfile not found in frontend/, trying root folder fallback..."
                                        sh "docker build -f ../Dockerfile -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest .."
                                    }
                                }
                            }
                        },
                        "Backend": {
                            script {
                                dir('backend') {
                                    if (fileExists('Dockerfile')) {
                                        sh "docker build -f Dockerfile -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ."
                                    } else if (fileExists('dockerfile')) {
                                        sh "docker build -f dockerfile -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ."
                                    } else {
                                        echo "Dockerfile not found in backend/, trying root folder fallback..."
                                        sh "docker build -f ../Dockerfile -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest .."
                                    }
                                }
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
                withCredentials([string(credentialsId: "${KUBE_TOKEN_ID}", variable: 'KUBE_TOKEN')]) {
                    dir('k8s') {
                        sh """
                            echo "=== Updating Deployment Images to Build Tag: ${IMAGE_TAG} ==="
                            sed -i "s|${FRONTEND_IMAGE}:latest|${FRONTEND_IMAGE}:${IMAGE_TAG}|g" workflow.yaml
                            sed -i "s|${BACKEND_IMAGE}:latest|${BACKEND_IMAGE}:${IMAGE_TAG}|g" workflow.yaml
                            
                            echo "=== Applying Kubernetes Configurations using Token ==="
                            
                            # ADDED: Deploys your Mongo-Express database GUI setup automatically
                            kubectl apply -f mongo-express.yaml --token=\${KUBE_TOKEN} --server=${KUBE_API_SERVER} --insecure-skip-tls-verify=true --validate=false
                            
                            kubectl apply -f mongo.yaml --token=\${KUBE_TOKEN} --server=${KUBE_API_SERVER} --insecure-skip-tls-verify=true --validate=false
                            kubectl apply -f workflow.yaml --token=\${KUBE_TOKEN} --server=${KUBE_API_SERVER} --insecure-skip-tls-verify=true --validate=false
                        """
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
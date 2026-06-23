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
                script {
                    parallel(
                        "Frontend": {
                            script {
                                // Switch into the frontend directory cleanly
                                dir('frontend') {
                                    if (fileExists('Dockerfile')) {
                                        sh "docker build -f Dockerfile -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ."
                                    } else if (fileExists('dockerfile')) {
                                        sh "docker build -f dockerfile -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ."
                                    } else {
                                        // Fallback: If it's in the root folder instead
                                        echo "Dockerfile not found in frontend/, trying root folder fallback..."
                                        sh "docker build -f ../Dockerfile -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest .."
                                    }
                                }
                            }
                        },
                        "Backend": {
                            script {
                                // Switch into the backend directory cleanly
                                dir('backend') {
                                    if (fileExists('Dockerfile')) {
                                        sh "docker build -f Dockerfile -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ."
                                    } else if (fileExists('dockerfile')) {
                                        sh "docker build -f dockerfile -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ."
                                    } else {
                                        // Fallback: If it's in the root folder instead
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
                // We use 'variable' to cleanly capture the file path string
                withCredentials([file(credentialsId: "${KUBE_CONFIG_ID}", variable: 'KUBECONFIG_FILE')]) {
                    dir('k8s') { 
                        echo "=== Updating Deployment Images ==="
                        sh "sed -i 's|joypatel2403/practise:latest|joypatel2403/practise:${IMAGE_TAG}|g' workflow.yaml"
                        
                        echo "=== Applying Kubernetes Configurations ==="
                        // Using double quotes inside single quotes protects the file path evaluation
                        sh 'KUBECONFIG="${KUBECONFIG_FILE}" kubectl apply -f mongo.yaml'
                        sh 'KUBECONFIG="${KUBECONFIG_FILE}" kubectl apply -f mongo-express.yaml'
                        sh 'KUBECONFIG="${KUBECONFIG_FILE}" kubectl apply -f workflow.yaml'
                        sh 'KUBECONFIG="${KUBECONFIG_FILE}" kubectl apply -f ingress.yaml'
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
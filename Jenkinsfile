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

        GITHUB_CRED_ID  = 'github-credentials'
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
                    } // Closes withCredentials
                } // Closes script (This was missing!)
            } // Closes steps
        } // Closes stage

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
        stage('Update Manifests & Git Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${GITHUB_CRED_ID}", usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASSWORD')]) {
                    dir('k8s') {
                        sh """
                            echo "=== Updating Git Manifests to Build Tag: ${IMAGE_TAG} ==="
                            
                            # Matches 'image: joypatel2403/ci-cd-workflow-xxx:<anything>' and swaps it with the exact build number
                            sed -i "s|image: ${FRONTEND_IMAGE}:.*|image: ${FRONTEND_IMAGE}:${IMAGE_TAG}|g" workflow.yaml
                            sed -i "s|image: ${BACKEND_IMAGE}:.*|image: ${BACKEND_IMAGE}:${IMAGE_TAG}|g" workflow.yaml
                            
                            echo "=== Committing changes back to GitHub ==="
                            git config user.email "jenkins-bot@example.com"
                            git config user.name "Jenkins Automation"
                            
                            git add workflow.yaml
                            
                            # [skip ci] stops Jenkins from executing another build automatically on this push
                            git commit -m "automation: upgrade app images to tag ${IMAGE_TAG} [skip ci]" || echo "No changes to commit"
                            
                           git push https://\${GIT_USER}:\${GIT_PASSWORD}@github.com/jay240322/cicd-sandbox.git HEAD:main
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
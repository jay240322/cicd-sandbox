pipeline {
    agent any

    environment {
        // Replace with your actual Docker Hub username
        DOCKER_HUB_USER = 'jay240322' 
        APP_NAME        = 'cicd-sandbox-nginx'
        IMAGE_TAG       = "${env.BUILD_NUMBER}"
        IMAGE_NAME      = "${DOCKER_HUB_USER}/${APP_NAME}:${IMAGE_TAG}"
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo 'Pulling the latest code from GitHub...'
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image: ${IMAGE_NAME}..."
                script {
                    // This builds using a Dockerfile in your root folder
                    sh "docker build -t ${IMAGE_NAME} ."
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo 'Logging into Docker Hub and pushing image...'
                // 'docker-hub-credentials' must match the ID of the credential you save in Jenkins
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', 
                                                 usernameVariable: 'DOCKER_USER', 
                                                 passwordVariable: 'DOCKER_PASS')]) {
                    sh "echo 'Updating registry...'"
                    sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                    sh "docker push ${IMAGE_NAME}"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo 'Deploying application to Kubernetes cluster...'
                script {
                    // Update your deployment yaml dynamically with the new image tag
                    // Assumes your deployment file is inside a 'k8s' folder
                    sh "sed -i 's|image:.*|image: ${IMAGE_NAME}|g' k8s/mongo-express.yaml" 
                    
                    // Apply your Kubernetes manifests
                    sh "kubectl apply -f k8s/"
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully! Build #${env.BUILD_NUMBER} is live."
        }
        failure {
            echo "Pipeline failed on Build #${env.BUILD_NUMBER}. Check logs above for details."
        }
    }
}

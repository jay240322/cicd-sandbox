pipeline {
    agent any

    environment {
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
                    // Using native plugin syntax instead of raw 'sh'
                    dockerImage = docker.build("${IMAGE_NAME}", ".")
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo 'Logging into Docker Hub and pushing image...'
                script {
                    // Using native plugin registry helper
                    docker.withRegistry('', 'docker-hub-credentials') {
                        dockerImage.push()
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo 'Deploying application to Kubernetes cluster...'
                script {
                    sh "sed -i 's|image:.*|image: ${IMAGE_NAME}|g' k8s/mongo-express.yaml" 
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

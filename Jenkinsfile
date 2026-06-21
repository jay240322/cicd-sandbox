pipeline {
    agent any

   environment {
        DOCKER_HUB_USER = 'joypatel2403' 
        APP_NAME        = 'ci-cd-workflow'
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
                echo "Building Docker image smoothly with plugin: ${IMAGE_NAME}..."
                script {
                    // The native plugin handles everything safely without raw 'sh' calls
                    dockerImage = docker.build("${IMAGE_NAME}", ".")
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo 'Logging into Docker Hub and pushing image...'
                script {
                    // Uses native plugin registry helper matching your credentials ID--
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

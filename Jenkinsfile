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
        script {
            sh "sed -i 's|image:.*|image: joypatel2403/ci-cd-workflow:2|g' k8s/mongo-express.yaml"
            
            withCredentials([file(credentialsId: 'k8s-config', variable: 'CLUSTER_KUBECONFIG')]) {
                // 1. Check if the file actually has content
                sh 'echo "=== Kubeconfig Content ===" && cat $CLUSTER_KUBECONFIG'
                
                // 2. See what cluster address kubectl is parsing from it
                sh 'KUBECONFIG=$CLUSTER_KUBECONFIG kubectl config view'
                
                // 3. Try the deployment
                sh 'KUBECONFIG=$CLUSTER_KUBECONFIG kubectl apply -f k8s/ --validate=false'
            }
        }
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

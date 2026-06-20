pipeline {
    agent any

    environment {
        DOCKER_HUB_USER = 'jay240322' 
        APP_NAME        = 'cicd-sandbox-nginx'
        IMAGE_TAG       = "${env.BUILD_NUMBER}"
        IMAGE_NAME      = "${DOCKER_HUB_USER}/${APP_NAME}:${IMAGE_TAG}"
        // This tells the docker CLI to look at your mounted Windows pipe instead of the default Linux path
        DOCKER_HOST     = 'unix:///./pipe/docker_engine'
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo 'Pulling the latest code from GitHub...'
                checkout scm
            }
        }

        stage('Setup Docker CLI Binary') {
            steps {
                echo 'Downloading official Docker CLI tool inside Jenkins container...'
                script {
                    sh '''
                        if [ ! -f ./docker ]; then
                            curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-24.0.7.tgz -o docker.tgz
                            tar -xzvf docker.tgz --strip-components=1 docker/docker
                            rm docker.tgz
                            chmod +x ./docker
                        fi
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building Docker image using local CLI binary: ${IMAGE_NAME}..."
                script {
                    sh "./docker build -t ${IMAGE_NAME} ."
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo 'Logging into Docker Hub and pushing image...'
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', 
                                                 usernameVariable: 'DOCKER_USER', 
                                                 passwordVariable: 'DOCKER_PASS')]) {
                    sh "./docker login -u \$DOCKER_USER -p \$DOCKER_PASS"
                    sh "./docker push ${IMAGE_NAME}"
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

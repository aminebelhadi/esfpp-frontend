pipeline {
    agent any

    environment {
        AWS_REGION     = 'eu-north-1' 
        AWS_ACCOUNT_ID = '119697987992' 
        ECR_REPO_NAME  = 'esfpp-frontend' 
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo "Récupération du code Frontend..."
                checkout scm
            }
        }

        stage('Build Image Docker (Multi-stage)') {
            steps {
                echo "Compilation React et création de l'image Nginx..."
                // Le Dockerfile fait le 'npm install' et le 'npm run build' de manière isolée
                sh "docker build -t ${ECR_REPO_NAME}:latest ."
            }
        }

        stage('Scan de Sécurité (Trivy)') {
            steps {
                echo "Recherche de vulnérabilités dans l'image Nginx/React..."
                sh 'mkdir -p .trivy-cache'
                // On garde l'exit-code 1 pour bloquer si une faille critique est trouvée !
                sh "TMPDIR=\$WORKSPACE/.trivy-cache trivy image --cache-dir \$WORKSPACE/.trivy-cache --exit-code 1 --severity CRITICAL ${ECR_REPO_NAME}:latest"
            }
        }

        stage('Push Image vers AWS ECR') {
            steps {
                echo "Connexion et envoi vers AWS ECR..."
                sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
                
                sh "docker tag ${ECR_REPO_NAME}:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${BUILD_NUMBER}"
                sh "docker tag ${ECR_REPO_NAME}:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:latest"
                
                sh "docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:${BUILD_NUMBER}"
                sh "docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}:latest"
            }
        }
        stage('Déploiement sur AWS EKS') {
            steps {
                echo "Connexion au cluster Kubernetes et Déploiement..."
                // On met à jour la configuration pour que kubectl puisse parler au cluster
                // (Note : on utilise bien la région eu-north-1 que tu as choisie)
                sh "aws eks update-kubeconfig --region eu-north-1 --name esfpp-cluster"
                
                // On applique tous les fichiers du dossier k8s
                sh "kubectl apply -f k8s/"
            }
        }
    }
}
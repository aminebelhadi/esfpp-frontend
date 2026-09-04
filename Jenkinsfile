pipeline {
    agent any

    stages {
        stage('Checkout Code') {
            steps {
                echo 'Récupération du code Frontend...'
                checkout scm
            }
        }

        stage('Build Image Docker (React)') {
            steps {
                echo 'Création de l'image Docker Frontend...'
                // Si tu as bien fait un Dockerfile multi-stage, Docker va se charger 
                // de faire le 'npm install' et 'npm run build' tout seul à l'intérieur !
                sh 'docker build -t esfpp-frontend:latest .'
            }
        }
    }
}
pipeline {
    agent any

    stages {
        stage('Checkout Code') {
            steps {
                echo "Récupération du code Frontend..."
                checkout scm
            }
        }

        stage('Build Image Docker (React)') {
            steps {
                // Utilisation de guillemets doubles pour protéger l'apostrophe
                echo "Création de l'image Docker Frontend..."
                sh 'docker build -t esfpp-frontend:latest .'
            }
        }
    }
}
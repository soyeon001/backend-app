pipeline {
    agent any
    
    tools {
        nodejs 'node22'
    }
    
    environment {
        SCANNER_HOME = tool 'sonar-scanner'
        ECR_REGISTRY = '394952106077.dkr.ecr.ap-northeast-2.amazonaws.com/backend-app'
        AWS_ACCESS_KEY_ID = credentials('AWS_ACCESS_KEY_ID')
        AWS_SECRET_ACCESS_KEY = credentials('AWS_SECRET_ACCESS_KEY')
        AWS_DEFAULT_REGION = "ap-northeast-2"
    }

    stages {
		    // 소스코드를 깃허브에서 체크아웃
        stage('Git Checkout') {
            steps {
                git branch: 'main', credentialsId: 'GITHUB_TOKEN', url: 'https://github.com/soyeon001/backend-app.git'
            }
        }
        // npm - package.json의 내용에 따라 프로젝트의 의존성 설치
        stage('Install Package Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        // Trivy - 파일 시스템에 대한 보안 취약점 스캔
        stage('Trivy FS Scan') {
            steps {
                sh 'trivy fs --format table -o fs-report-${BUILD_NUMBER}.html .'
            }
        }
        // SonarQube - 코드 품질 검사
        stage('SonarQube') {
            steps {
                // Jenkins 관리 -> System에서 설정한 소나큐브 서버 구성을 사용한다
                withSonarQubeEnv('sonarqube') {
                    // [소나큐브 스캐너 실행 파일 경로] -Dsonar.projectKey=[프로젝트 키(필수, 프로젝트 식별자)] -Dsonar.projectName=[프로젝트 이름(선택, UI에서 표시되는 이름)]
                    sh '${SCANNER_HOME}/bin/sonar-scanner -Dsonar.projectKey=backendapp -Dsonar.projectName=backendapp'
                }   
            }
        }
        // Docker - 소스코드로부터 도커 이미지를 빌드
        stage('Docker Build & Tag') {
            steps {
                // ECR 로그인
                sh "aws ecr get-login-password | docker login --username AWS --password-stdin ${ECR_REGISTRY}"
                // Docker 이미지 빌드 및 태그
                sh "docker build -t ${ECR_REGISTRY}:${BUILD_NUMBER} ."
                sh "docker tag ${ECR_REGISTRY}:${BUILD_NUMBER} ${ECR_REGISTRY}:latest"
            }
        }
        // Trivy - 빌드된 도커 이미지의 보안 취약점 스캔
        stage('Trivy Image Scan') {
            steps {
                sh 'trivy --scanners vuln image --format table -o image-report-${BUILD_NUMBER}.html ${ECR_REGISTRY}:${BUILD_NUMBER}'
            }
        }
        // Docker - 빌드된 도커 이미지를 ECR로 푸시
        stage('Docker Push Image') {
            steps {
                // ECR 로그인
                sh "aws ecr get-login-password | docker login --username AWS --password-stdin ${ECR_REGISTRY}"
                // Docker 이미지 푸시 (태그별로 푸시해야 태그가 적용된다)
                sh "docker push ${ECR_REGISTRY}:${BUILD_NUMBER}"
                sh "docker push ${ECR_REGISTRY}:latest"
                // 푸시한 이미지 삭제 (삭제 안하면 서버에 계속 쌓인다)
                sh "docker rmi ${ECR_REGISTRY}:${BUILD_NUMBER}"
                sh "docker rmi ${ECR_REGISTRY}:latest"
            }
        }
    }
    post {
	      always {
			      // Trivy 취약점 보고서를 따로 archiveArtifacts로 보관 (워크스페이스 초기화를 하면 사라지므로)
	          archiveArtifacts artifacts: '*.html', fingerprint: true
	          // 워크스페이스 초기화
            cleanWs()
	      }
	      // 파이프라인 성공/실패 슬랙 알림 전송
        success {
	          slackSend (color: '#36A64F', message: "SUCCESS: GOMAPP (version : ${BUILD_NUMBER}) CI / CD completed successfully.")
        }
        failure {
	          slackSend (color: '#FF0000', message: "FAILURE: GOMAPP (version : ${BUILD_NUMBER}) CI / CD failed. Check Jenkins logs for more details.")
        }
    }
}
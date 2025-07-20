<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$dataDir = '../data/';
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0755, true);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'POST':
        if ($action === 'save') {
            saveQuiz();
        } elseif ($action === 'save-result') {
            saveResult();
        } elseif ($action === 'delete') {
            deleteQuiz();
        }
        break;
    case 'GET':
        if ($action === 'get') {
            getQuiz();
        } elseif ($action === 'list') {
            listQuizzes();
        } elseif ($action === 'get-results') {
            getResults();
        }
        break;
function deleteQuiz() {
    global $dataDir;
    $input = json_decode(file_get_contents('php://input'), true);
    $quizId = $input['quizId'] ?? '';
    if (!$quizId) {
        http_response_code(400);
        echo json_encode(['error' => 'Quiz ID required']);
        return;
    }
    $filename = $dataDir . 'quiz_' . $quizId . '.json';
    $resultsFile = $dataDir . 'results_' . $quizId . '.json';
    $success = true;
    $msg = [];
    if (file_exists($filename)) {
        if (!unlink($filename)) {
            $success = false;
            $msg[] = 'Failed to delete quiz file';
        }
    }
    if (file_exists($resultsFile)) {
        if (!unlink($resultsFile)) {
            $success = false;
            $msg[] = 'Failed to delete results file';
        }
    }
    if ($success) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => implode('; ', $msg)]);
    }
}
}

function saveQuiz() {
    global $dataDir;
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['quiz'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid quiz data']);
        return;
    }
    
    $quiz = $input['quiz'];
    $quizId = $quiz['id'] ?? 'quiz_' . time();
    $filename = $dataDir . 'quiz_' . $quizId . '.json';
    
    // Thêm metadata
    $quiz['savedAt'] = date('c');
    $quiz['id'] = $quizId;
    
    if (file_put_contents($filename, json_encode($quiz, JSON_PRETTY_PRINT))) {
        echo json_encode([
            'success' => true,
            'quizId' => $quizId,
            'filename' => basename($filename)
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save quiz']);
    }
}

function getQuiz() {
    global $dataDir;
    
    $quizId = $_GET['id'] ?? '';
    if (!$quizId) {
        http_response_code(400);
        echo json_encode(['error' => 'Quiz ID required']);
        return;
    }
    
    $filename = $dataDir . 'quiz_' . $quizId . '.json';
    if (file_exists($filename)) {
        $quiz = json_decode(file_get_contents($filename), true);
        echo json_encode($quiz);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Quiz not found']);
    }
}

function listQuizzes() {
    global $dataDir;
    
    $quizzes = [];
    $files = glob($dataDir . 'quiz_*.json');
    
    foreach ($files as $file) {
        $quiz = json_decode(file_get_contents($file), true);
        if ($quiz) {
            $quizzes[] = [
                'id' => $quiz['id'],
                'title' => $quiz['title'],
                'description' => $quiz['description'] ?? '',
                'totalQuestions' => $quiz['totalQuestions'] ?? 0,
                'duration' => $quiz['duration'] ?? 30,
                'createdAt' => $quiz['createdAt'] ?? $quiz['savedAt'],
                'slug' => $quiz['slug'] ?? $quiz['id']
            ];
        }
    }
    
    echo json_encode($quizzes);
}

function saveResult() {
    global $dataDir;
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['result'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid result data']);
        return;
    }
    
    $result = $input['result'];
    $quizId = $result['quizId'];
    $resultId = 'result_' . time() . '_' . uniqid();
    
    $resultsFile = $dataDir . 'results_' . $quizId . '.json';
    $results = [];
    
    if (file_exists($resultsFile)) {
        $results = json_decode(file_get_contents($resultsFile), true) ?: [];
    }
    
    $result['id'] = $resultId;
    $result['submittedAt'] = date('c');
    $results[] = $result;
    
    if (file_put_contents($resultsFile, json_encode($results, JSON_PRETTY_PRINT))) {
        echo json_encode([
            'success' => true,
            'resultId' => $resultId
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save result']);
    }
}

function getResults() {
    global $dataDir;
    
    $quizId = $_GET['quizId'] ?? '';
    if (!$quizId) {
        http_response_code(400);
        echo json_encode(['error' => 'Quiz ID required']);
        return;
    }
    
    $resultsFile = $dataDir . 'results_' . $quizId . '.json';
    if (file_exists($resultsFile)) {
        $results = json_decode(file_get_contents($resultsFile), true);
        echo json_encode($results ?: []);
    } else {
        echo json_encode([]);
    }
}
?>

<?php
echo "<h1>Debug Quiz System</h1>";

// Check data directory
$dataDir = './data/';
echo "<h2>Data Directory Check</h2>";
echo "Path: " . realpath($dataDir) . "<br>";
echo "Exists: " . (file_exists($dataDir) ? 'YES' : 'NO') . "<br>";
echo "Writable: " . (is_writable($dataDir) ? 'YES' : 'NO') . "<br>";

// List files
echo "<h2>Files in data/</h2>";
if (file_exists($dataDir)) {
    $files = scandir($dataDir);
    foreach ($files as $file) {
        if ($file != '.' && $file != '..') {
            echo $file . "<br>";
        }
    }
} else {
    echo "Directory not found<br>";
}

// Test API
echo "<h2>API Test</h2>";
echo "<a href='api/quiz.php?action=list'>Test List API</a><br>";

// PHP Info
echo "<h2>PHP Info</h2>";
echo "PHP Version: " . phpversion() . "<br>";
echo "JSON Extension: " . (extension_loaded('json') ? 'YES' : 'NO') . "<br>";
?>
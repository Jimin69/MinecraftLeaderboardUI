<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Content-Type: application/json');
    exit(0);
}

header('Content-Type: application/json');

$dataFile = __DIR__ . '/players.json';

function loadPlayers($file) {
    if (!file_exists($file)) return [];
    $data = json_decode(file_get_contents($file), true);
    return is_array($data) ? $data : [];
}

function savePlayers($file, $players) {
    file_put_contents($file, json_encode(array_values($players), JSON_PRETTY_PRINT));
}

function resolveImage() {
    $url = trim($_POST['image_url'] ?? '');
    if ($url !== '') return $url;
    return null;
}

$method  = $_SERVER['REQUEST_METHOD'];
$action  = $_GET['action'] ?? '';
$id      = isset($_GET['id']) ? (int)$_GET['id'] : null;
$players = loadPlayers($dataFile);

if ($method === 'GET') {
    usort($players, fn($a, $b) => $b['score'] - $a['score']);
    echo json_encode($players);
    exit;
}

if ($method === 'POST') {
    switch ($action) {

        case 'add': {
            $name  = trim($_POST['name'] ?? '');
            $score = (int)($_POST['score'] ?? 0);
            if (!$name) { echo json_encode(['error' => 'Name required']); exit; }

            $imageUrl = resolveImage();
            $maxId    = count($players) > 0 ? max(array_column($players, 'id')) : 0;
            $player   = ['id' => $maxId + 1, 'name' => $name, 'score' => $score, 'image' => $imageUrl];
            $players[] = $player;
            savePlayers($dataFile, $players);
            echo json_encode($player);
            break;
        }

        case 'update': {
            $name  = trim($_POST['name'] ?? '');
            $score = ($_POST['score'] ?? '') !== '' ? (int)$_POST['score'] : null;
            $found = false;
            foreach ($players as &$p) {
                if ($p['id'] === $id) {
                    if ($name)           $p['name']  = $name;
                    if ($score !== null) $p['score'] = $score;
                    $newImg = resolveImage();
                    if ($newImg)         $p['image'] = $newImg;
                    savePlayers($dataFile, $players);
                    echo json_encode($p);
                    $found = true;
                    break;
                }
            }
            if (!$found) echo json_encode(['error' => 'Not found']);
            break;
        }

        case 'vote': {
            $type  = $_GET['type'] ?? 'up';
            $found = false;
            foreach ($players as &$p) {
                if ($p['id'] === $id) {
                    $p['score'] += ($type === 'up') ? 1 : -1;
                    savePlayers($dataFile, $players);
                    echo json_encode($p);
                    $found = true;
                    break;
                }
            }
            if (!$found) echo json_encode(['error' => 'Not found']);
            break;
        }

        case 'delete': {
            $players = array_values(array_filter($players, fn($p) => $p['id'] !== $id));
            savePlayers($dataFile, $players);
            echo json_encode(['success' => true]);
            break;
        }

        default:
            echo json_encode(['error' => 'Unknown action']);
    }
    exit;
}

echo json_encode(['error' => 'Method not allowed']);
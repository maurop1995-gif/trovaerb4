<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function suggestion_response(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    suggestion_response(405, ['success' => false, 'message' => 'Método no permitido.']);
}

$projectRoot = dirname(__DIR__);
$configPaths = [
    dirname($projectRoot) . '/.forms.env.php',
    $projectRoot . '/.forms.env.php',
];

$config = [];
foreach ($configPaths as $configPath) {
    if (!is_file($configPath)) {
        continue;
    }

    $loaded = require $configPath;
    if (is_array($loaded)) {
        $config = $loaded;
    }
    break;
}

$recipient = trim((string) ($config['suggestions_recipient'] ?? ''));
$fromEmail = trim((string) ($config['from_email'] ?? 'no-reply@lostrovadores.com.uy'));

if (!filter_var($recipient, FILTER_VALIDATE_EMAIL) || !filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
    suggestion_response(503, [
        'success' => false,
        'message' => 'El formulario todavía no está configurado.',
    ]);
}

// Honeypot: los visitantes reales nunca completan este campo.
if (trim((string) ($_POST['_honey'] ?? '')) !== '') {
    suggestion_response(200, ['success' => true]);
}

$name = trim(strip_tags((string) ($_POST['Nombre'] ?? '')));
$flavor = trim(strip_tags((string) ($_POST['Sabor ideal'] ?? '')));
$idea = trim(strip_tags((string) ($_POST['Idea'] ?? '')));

if ($name === '' || $flavor === '' || $idea === '') {
    suggestion_response(422, [
        'success' => false,
        'message' => 'Completá todos los campos.',
    ]);
}

if (mb_strlen($name) > 120 || mb_strlen($flavor) > 180 || mb_strlen($idea) > 3000) {
    suggestion_response(422, [
        'success' => false,
        'message' => 'Uno de los campos es demasiado largo.',
    ]);
}

$subject = 'Nueva sugerencia de sabor - Los Trovadores';
$body = implode("\n", [
    'Nueva sugerencia recibida desde la web',
    '',
    'Nombre: ' . $name,
    'Sabor ideal: ' . $flavor,
    '',
    'Idea:',
    $idea,
]);
$headers = [
    'From: Los Trovadores <' . $fromEmail . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . PHP_VERSION,
];

if (!mail($recipient, $subject, $body, implode("\r\n", $headers))) {
    suggestion_response(500, [
        'success' => false,
        'message' => 'No se pudo enviar la sugerencia.',
    ]);
}

suggestion_response(200, ['success' => true]);

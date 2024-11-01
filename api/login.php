<?php
require ("helpers/handler.php");

$handler = new Handler();
$handler->process();

function POST(Handler $handler)
{
    $username = $handler->request->post['username'] ?? null;
    $password = $handler->request->post['password'] ?? null;

    if (!$username || !$password) {
        $handler->response->json(['error' => 'Username and password are required'], 400);
        return;
    }

    $pdo = $handler->db->PDO();
    $query = "SELECT * FROM users WHERE username = ?";
    $statement = $pdo->prepare($query);
    $statement->execute([$username]);
    $user = $statement->fetch();

    if (!$user) {
        $handler->response->json(['error' => 'User not found'], 404);
        return;
    }

    if (!password_verify($password, $user['password'])) {
        $handler->response->json(['error' => 'Invalid password'], 401);
        return;
    }

    unset($user['password']);

    $handler->response->json(['message' => 'Login successful', 'user' => $user]);
}
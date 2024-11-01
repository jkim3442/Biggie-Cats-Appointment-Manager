<?php
require ("helpers/handler.php");

$handler = new Handler();
$handler->process();

function GET(Handler $handler)
{
    $id = $handler->request->get['id'] ?? false;

    if ($id) {
        $pdo = $handler->db->PDO();
        $query = "SELECT * FROM users WHERE id = ?";
        $statement = $pdo->prepare($query);
        $statement->execute([$id]);
        $result = $statement->fetchAll();
        unset($result[0]['password']);
        $handler->response->json(["user" => $result[0]]);
    } else {
        $pdo = $handler->db->PDO();
        $query = "SELECT * FROM users";
        $statement = $pdo->prepare($query);
        $statement->execute();
        $results = $statement->fetchAll();

        foreach ($results as $key => $result) {
            unset($results[$key]['password']);
        }

        $handler->response->json(["users" => $results]);
    }
}

function POST(Handler $handler)
{
    $username = $handler->request->post['username'] ?? null;
    $password = $handler->request->post['password'] ?? null;
    $email = $handler->request->post['email'] ?? null;

    if (strlen($password) < 8) {
        $handler->response->json(['error' => 'Password must be at least 8 characters long'], 400);
        return;
    } else if (!preg_match('/[A-Z]/', $password)) {
        $handler->response->json(['error' => 'Password must contain at least one uppercase letter'], 400);
        return;
    } else if (!preg_match('/[a-z]/', $password)) {
        $handler->response->json(['error' => 'Password must contain at least one lowercase letter'], 400);
        return;
    } else if (!preg_match('/[0-9]/', $password)) {
        $handler->response->json(['error' => 'Password must contain at least one number'], 400);
        return;
    }

    if ($username && $password && $email) {
        $pdo = $handler->db->PDO();
        $query = "INSERT INTO users (username, password, email) VALUES (:username, :password, :email)";
        $statement = $pdo->prepare($query);
        try {
            $statement->execute([':username' => $username, ':password' => password_hash($password, null), ':email' => $email]);
        } catch (PDOException $e) {
            $handler->response->json(['error' => 'Username or email already exists'], 400);
            return;
        }
        $user = ['id' => $pdo->lastInsertId(), 'username' => $username, 'email' => $email];
        $handler->response->json(['message' => 'User created successfully', 'user' => $user]);
    } else {
        $handler->response->json(['error' => 'Missing parameters'], 400);
    }
}

function PUT(Handler $handler)
{
    $params = $handler->request->input;
    $id = $params['id'] ?? null;
    $username = $params['username'] ?? null;
    $password = $params['password'] ?? null;
    $email = $params['email'] ?? null;

    if ($id && ($username || $password || $email)) {
        $pdo = $handler->db->PDO();
        $queryParams = [];
        $sql = "UPDATE users SET ";
        if ($username) {
            $queryParams['username'] = $username;
            $sql .= "username = :username, ";
        }
        if ($password) {
            $queryParams['password'] = password_hash($password, null);
            $sql .= "password = :password, ";
        }
        if ($email) {
            $queryParams['email'] = $email;
            $sql .= "email = :email, ";
        }
        $sql = rtrim($sql, ', ') . " WHERE id = :id";
        $queryParams['id'] = $id;
        $statement = $pdo->prepare($sql);
        try {
            $statement->execute($queryParams);
        } catch (PDOException $e) {
            $handler->response->json(['error' => 'Username or email already exists'], 400);
            return;
        }
        $handler->response->json(['message' => 'User updated successfully']);
    } else {
        $handler->response->json(['error' => 'Missing parameters'], 400);
    }
}

function DELETE(Handler $handler)
{
    $params = $handler->request->input;
    $id = $params['id'] ?? null;

    if ($id) {
        $pdo = $handler->db->PDO();
        $query = "DELETE FROM users WHERE id = :id";
        $statement = $pdo->prepare($query);
        $statement->execute([':id' => $id]);
        $handler->response->json(['message' => 'User deleted successfully']);
    } else {
        $handler->response->json(['error' => 'Missing user ID'], 400);
    }
}



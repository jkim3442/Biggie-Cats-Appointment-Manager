<?php
require ("helpers/handler.php");

$handler = new Handler();
$handler->process();

function GET(Handler $handler)
{
    $userId = $handler->request->get['user_id'] ?? false;
    $id = $handler->request->get['id'] ?? false;
    $day = $handler->request->get['day'] ?? null;
    $month = $handler->request->get['month'] ?? null;
    $year = $handler->request->get['year'] ?? null;
    $past = $handler->request->get['past'] ?? false;
    $upcoming = $handler->request->get['upcoming'] ?? false;

    if (!$userId) {
        $handler->response->json(['error' => 'User ID is required'], 400);
        return;
    }
    $pdo = $handler->db->PDO();

    if ($id) {
        $query = "SELECT * FROM appointments WHERE id = ? AND user_id = ?";
        $statement = $pdo->prepare($query);
        $statement->execute([$id, $userId]);
        $result = $statement->fetchAll();
        $handler->response->json($result[0]);
        return;
    }

    $query = "SELECT * FROM appointments WHERE user_id = ?";
    $params = [$userId];

    if ($past) {
        // Fetch the past five appointments
        $query .= " AND end_time < NOW() ORDER BY end_time DESC LIMIT 5";
    } elseif ($upcoming) {
        // Fetch the upcoming five appointments
        $query .= " AND start_time > NOW() ORDER BY start_time ASC LIMIT 5";
    } elseif ($day || $month || $year) {
        // Filtering by month and year
        $year = $year ?: date("Y");
        $month = $month ?: date("m");

        if ($day) {
            $query .= " AND DAY(start_time) = ? AND MONTH(start_time) = ? AND YEAR(start_time) = ?";
            array_push($params, $day, $month, $year);
        } else if ($month) {
            $query .= " AND MONTH(start_time) = ? AND YEAR(start_time) = ?";
            array_push($params, $month, $year);
        } else if ($year) {
            $query .= " AND YEAR(start_time) = ?";
            array_push($params, $year);
        }
    } else {
        $handler->response->json(['error' => 'Invalid query parameters'], 400);
    }

    $statement = $pdo->prepare($query);
    $statement->execute($params);
    $handler->response->json($statement->fetchAll());
}


function POST(Handler $handler)
{
    $userId = $handler->request->post['user_id'] ?? null;
    $title = $handler->request->post['title'] ?? null;
    $description = $handler->request->post['description'] ?? null;
    $startTime = $handler->request->post['start_time'] ?? null;
    $endTime = $handler->request->post['end_time'] ?? null;
    $date = $handler->request->post['date'] ?? null;

    //check if the user exists
    $pdo = $handler->db->PDO();
    $query = "SELECT COUNT(*) FROM users WHERE id = ?";
    $statement = $pdo->prepare($query);
    $statement->execute([$userId]);
    if ($statement->fetchColumn() == 0) {
        $handler->response->json(['error' => 'User not found'], 404);
        return;
    }


    if ($userId && $title && $startTime && $endTime && $date) {
        // Combine the date and time strings to create the full start and end time strings
        $startTime = $date . ' ' . $startTime;
        $endTime = $date . ' ' . $endTime;

        // Ensure that the end time is after the start time and at least 15 minutes later
        $startTimestamp = strtotime($startTime);
        $endTimestamp = strtotime($endTime);
        if ($endTimestamp <= $startTimestamp) {
            $handler->response->json(['error' => 'End time must be after start time'], 400);
            return;
        } elseif (($endTimestamp - $startTimestamp) < 900) { // 900 seconds = 15 minutes
            $handler->response->json(['error' => 'End time must be at least 15 minutes after start time'], 400);
            return;
        }

        // Check for overlapping appointments
        $overlapQuery = "SELECT COUNT(*) FROM appointments WHERE user_id = :user_id AND (
                            (start_time < :end_time AND end_time > :start_time)
                        )";
        $overlapStmt = $pdo->prepare($overlapQuery);
        $overlapStmt->execute([
            ':user_id'    => $userId,
            ':start_time' => $startTime,
            ':end_time'   => $endTime
        ]);
        $overlapCount = $overlapStmt->fetchColumn();

        if ($overlapCount > 0) {
            // If there are overlapping appointments, return an error
            $handler->response->json(['error' => 'Appointment time conflicts with an existing appointment'], 409);
        } else {
            // Insert the new appointment
            $query = "INSERT INTO appointments (user_id, title, description, start_time, end_time) VALUES (:user_id, :title, :description, :start_time, :end_time)";
            $statement = $pdo->prepare($query);
            $statement->execute([
                ':user_id'     => $userId,
                ':title'       => $title,
                ':description' => $description,
                ':start_time'  => $startTime,
                ':end_time'    => $endTime
            ]);
            $handler->response->json(['message' => 'Appointment created successfully']);
        }
    } else {
        $handler->response->json(['error' => 'Missing parameters'], 400);
    }
}


function PUT(Handler $handler)
{
    $params = $handler->request->input;
    $id = $params['id'] ?? null;
    $userId = $params['user_id'] ?? null;
    $title = $params['title'] ?? null;
    $description = $params['description'] ?? null;
    $startTime = $params['start_time'] ?? null;
    $endTime = $params['end_time'] ?? null;

    if ($id && $userId) {
        $pdo = $handler->db->PDO();

        // Check if the appointment belongs to the user
        $checkQuery = "SELECT COUNT(*) FROM appointments WHERE id = :id AND user_id = :user_id";
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->execute([
            ':id'      => $id,
            ':user_id' => $userId
        ]);

        if ($checkStmt->fetchColumn() == 0) {
            $handler->response->json(['error' => 'Appointment not found'], 404);
            return;
        }

        $existingAppointment = $pdo->query("SELECT * FROM appointments WHERE id = $id")->fetch();
        $date = explode(" ", $existingAppointment['start_time'])[0];
        $exitingStartTime = explode(" ", $existingAppointment['start_time'])[1];
        $exitingEndTime = explode(" ", $existingAppointment['end_time'])[1];

        if (!$title && !$description && !$startTime && !$endTime) {
            $handler->response->json(['error' => 'No parameters provided to update'], 400);
            return;
        }

        // Ensure all time parameters are provided if any is given
        if ($startTime || $endTime) {
            if (!$startTime || !$endTime) {
                $handler->response->json(['error' => 'Must provide start time and end time to update schedule'], 400);
                return;
            }

            // Combine the date and time strings to create the full start and end time strings
            $startTime = $date . ' ' . $startTime;
            $endTime = $date . ' ' . $endTime;

            // Additional time validations as before
            $startTimestamp = strtotime($startTime);
            $endTimestamp = strtotime($endTime);
            if ($endTimestamp <= $startTimestamp) {
                $handler->response->json(['error' => 'End time must be after start time'], 400);
                return;
            } elseif (($endTimestamp - $startTimestamp) < 900) {
                $handler->response->json(['error' => 'End time must be at least 15 minutes after start time'], 400);
                return;
            }

            // Check for overlapping appointments
            $overlapQuery = "SELECT COUNT(*) FROM appointments WHERE user_id = :user_id AND (
                            (start_time < :end_time AND end_time > :start_time)
                        ) AND id != :id";
            $overlapStmt = $pdo->prepare($overlapQuery);
            $overlapStmt->execute([
                ':user_id'    => $userId,
                ':start_time' => $startTime,
                ':end_time'   => $endTime,
                ':id'         => $id
            ]);
            $overlapCount = $overlapStmt->fetchColumn();

            if ($overlapCount > 0) {
                // If there are overlapping appointments, return an error
                $handler->response->json(['error' => 'Appointment time conflicts with an existing appointment'], 409);
            }
        }

        // Prepare update statement
        $queryParams = [];
        $sql = "UPDATE appointments SET ";
        if ($title) {
            $queryParams['title'] = $title;
            $sql .= "title = :title, ";
        }
        if ($description) {
            $queryParams['description'] = $description;
            $sql .= "description = :description, ";
        }
        if ($startTime && $endTime && $date) {
            $queryParams['start_time'] = $startTime;
            $queryParams['end_time'] = $endTime;
            $sql .= "start_time = :start_time, end_time = :end_time, ";
        }
        $sql = rtrim($sql, ', ') . " WHERE id = :id AND user_id = :user_id";
        $queryParams['id'] = $id;
        $queryParams['user_id'] = $userId;

        $statement = $pdo->prepare($sql);
        $statement->execute($queryParams);
        $handler->response->json(['message' => 'Appointment updated successfully']);
    } else {
        $handler->response->json(['error' => 'Missing or incomplete parameters'], 400);
    }
}


function DELETE(Handler $handler)
{
    $params = $handler->request->input;
    $id = $params['id'] ?? null;
    $userId = $params['user_id'] ?? null;

    if ($id && $userId) {
        $pdo = $handler->db->PDO();

        //check if the appointment belongs to the user
        $checkQuery = "SELECT COUNT(*) FROM appointments WHERE id = :id AND user_id = :user_id";
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->execute([
            ':id'      => $id,
            ':user_id' => $userId
        ]);
        if ($checkStmt->fetchColumn() == 0) {
            $handler->response->json(['error' => 'Appointment not found'], 404);
        }

        $query = "DELETE FROM appointments WHERE id = :id";
        $statement = $pdo->prepare($query);
        $statement->execute([':id' => $id]);
        $handler->response->json(['message' => 'Appointment deleted successfully']);
    } else {
        $handler->response->json(['error' => 'Missing or incomplete parameters'], 400);
    }
}



<?php
require ("helpers/handler.php");

$handler = new Handler();
$handler->process();

/**
 * This function will drop all tables in the database and recreate them with some seeded data.
 * @param Handler $handler
 * @return void
 */
function POST(Handler $handler)
{
    $pdo = $handler->db->PDO();
    $initializeSqlPath = __DIR__ . "/../db/initialize.sql";
    $initializeSql = file_get_contents($initializeSqlPath);
    $seedSqlPath = __DIR__ . "/../db/seed.sql";
    $seedSql = file_get_contents($seedSqlPath);
    // split up the query by semi-colons
    $queries = explode(";", $initializeSql . $seedSql);
    // execute each query
    foreach ($queries as $q) {
        if (trim($q) == "") {
            continue;
        }

        $pdo->exec($q);
    }

    $handler->response->json(['message' => 'Database Reinitialized']);
}
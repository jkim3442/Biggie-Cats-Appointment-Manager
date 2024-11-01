<?php

class DB
{
    private string $credentialFilePath;

    public function __construct()
    {
        $this->credentialFilePath = __DIR__ . "/credentials.json";
    }

    private function getCredentialsFromFile()
    {
        $json = file_get_contents($this->credentialFilePath);

        $credentials = json_decode($json, true);

        return $credentials;
    }

    // Use if your data source is MySQL and you want to use PDO
    public function PDO()
    {
        $credentials = $this->getCredentialsFromFile();
        $charset = 'utf8mb4';

        $dsn = "mysql:host={$credentials['host']};port={$credentials['port']};dbname={$credentials['database']};charset=$charset";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        $pdo = new PDO($dsn, $credentials['username'], $credentials['password'], $options);

        return $pdo;
    }
}
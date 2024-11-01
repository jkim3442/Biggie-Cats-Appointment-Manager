<?php

require ("helpers/request.php");
require ("helpers/db.php");
require ("helpers/response.php");

class Handler
{

    public Response $response;
    public Request $request;
    public DB $db;

    public function __construct()
    {
        $this->db = new DB();
        $this->request = new Request();
        $this->response = new Response();
    }

    public function process()
    {
        if (!function_exists($this->request->method)) {
            $this->response->json(["error" => "Method not allowed"], 405);
        }

        try {
            $this->exec($this->request->method);
        } catch (Exception $e) {
            $this->response->json(["error" => $e->getMessage()], 500);
        }
    }

    private function exec($method)
    {
        $method($this);
    }
}


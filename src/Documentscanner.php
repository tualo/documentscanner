<?php

namespace Tualo\Office\Documentscanner;

use Tualo\Office\Basic\TualoApplication;
use Ramsey\Uuid\Uuid;
use GuzzleHttp\Client;

class Documentscanner
{

    private static $ENV = null;

    public static function env(string $key,mixed $default=false)
    {
        $env = self::getEnvironment();
        if (isset($env[$key])) {
            return $env[$key];
        }
        return $default;
    }

    public static function getEnvironment(): array
    {
        if (is_null(self::$ENV)) {
            $db = TualoApplication::get('session')->getDB();
            try {
                if (!is_null($db)) {
                    $data = $db->direct('select id,val from sms_environment');
                    foreach ($data as $d) {
                        self::$ENV[$d['id']] = $d['val'];
                    }
                }
            } catch (\Exception $e) {
            }
        }
        return self::$ENV;
    }

    public static function sendMessage(
        string $message,
        string $phonenumber
    ) : mixed {
        // https://gate1.goyyamobile.com
        $client = new Client(
            [
                'base_uri' => self::env('base_url'),
                'timeout'  => 20.0,
            ]
        );
        $params = [
            'receiver'=>$phonenumber,
            'sender'=>urlencode(self::env('sendername')),
            'msg'=>urlencode($message),
            'authToken'=>self::env('authToken'),
            'tarif'=>self::env('tarif','PM'),
            'time'=>0,
            'msgtype'=>'t',
            'getID'=>1,
            'countMsg'=>1
        ];
        $url_param='';
        foreach($params as $key=>$val) $url_param.=$key.'='.$val.'&';

        $response = $client->get('/sms/sendsms.asp?'.$url_param );
        $code = $response->getStatusCode(); // 200
        $reason = $response->getReasonPhrase(); // OK
        if ($code != 200) {
            throw new \Exception($reason);
        }
        return $response->getBody()->getContents();
    }
}


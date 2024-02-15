<?php
namespace Tualo\Office\Documentscanner\Checks;

use Tualo\Office\Basic\Middleware\Session;
use Tualo\Office\Basic\PostCheck;
use Tualo\Office\Basic\TualoApplication as App;


class Tables extends PostCheck {
    
    public static function test(array $config){
        $clientdb = App::get('clientDB');
        if (is_null($clientdb)) return;
        $tables = [
            // 'sms_environment'=>[],
        ];
        self::tableCheck('sms',$tables,
            "please run the following command: `./tm install-sql-sms --client ".$clientdb->dbname."`",
            "please run the following command: `./tm install-sql-sms --client ".$clientdb->dbname."`"

        );
    }
}
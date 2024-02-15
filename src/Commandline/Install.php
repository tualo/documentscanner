<?php
namespace Tualo\Office\Documentscanner\Commandline;
use Tualo\Office\Basic\ICommandline;
use Tualo\Office\Basic\CommandLineInstallSQL;

class Install extends CommandLineInstallSQL  implements ICommandline{
    public static function getDir():string {   return dirname(__DIR__,1); }
    public static $shortName  = 'documentscanner';
    public static $files = [
        /*
        'install/sms_environment' => 'setup sms_environment  ',
        'install/sms_environment.initial' => 'setup sms_environment initial values ',
        'install/sms_environment.ds' => 'setup sms_environment  ds ',
        */
    ];
    
}
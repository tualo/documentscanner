<?php

namespace Tualo\Office\Documentscanner\Middlewares;
use Tualo\Office\Basic\TualoApplication;
use Tualo\Office\Basic\IMiddleware;

class Middleware implements IMiddleware{
    public static function register(){
        TualoApplication::use('jsdocumentscanner',function(){
            try{
                // TualoApplication::module('jsdocumentscanner', './jsdocumentscanner/lib/test.js',[],-10000);
                TualoApplication::javascript('jsdocumentscanner', './jsdocumentscanner/lib/jscanify.min.js',[],-10000);
                // TualoApplication::stylesheet( './cherry-markdownlib/dist/cherry-markdown.min.css',10000);
            }catch(\Exception $e){
                TualoApplication::set('maintanceMode','on');
                TualoApplication::addError($e->getMessage());
            }
        },-100); // should be one of the last
    }
}
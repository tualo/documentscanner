
Ext.define('Tualo.routes.Documentscanner', {
    statics: {
        load: async function() {
            return [
                {
                    name: 'documentscanner/test',
                    path: '#documentscanner/test'
                }
            ]
        }
    }, 
    url: 'documentscanner/test',
    handler: {
        action: function () {
            console.log('success','a');
            Ext.require('Tualo.'+'Documentscanner.Viewport', function(){
                console.log('success','b');
                Ext.getApplication().addView('Tualo.Documentscanner.Viewport');
            });
            //
        },
        before: function (action) {
            action.resume();
        }
    }
});



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
            
            Ext.getApplication().addView('Tualo.Documentscanner.Viewport');
        },
        before: function (action) {
            action.resume();
        }
    }
});


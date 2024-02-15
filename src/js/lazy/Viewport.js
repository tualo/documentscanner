Ext.define('Tualo.Documentscanner.Viewport', {
    extend: 'Ext.form.Panel',
    requires: [],
    //layout: 'fit',
    bodyPadding: 10,
    items:[
        {
            xtype: 'textfield',
            value: '',
            anchor: '100%',
            fieldLabel: 'Phonenumber',
            name: 'phonenumber'
        },
        {
            xtype: 'textfield',
            value: '',
            anchor: '100%',
            fieldLabel: 'Message',
            name: 'message'
        },
    ],
    buttons:[
        {
            text: "Send",
            handler: function(){
                var form = this.up('form').getForm();
                if (form.isValid()) {
                    var values = form.getValues();
                    Tualo.Ajax.request({
                        url: './sms/send',
                        showWait: true,
                        params: values,
                        scope: this,
                        json: function(o){
                            if (o.success==false){
                                Ext.toast({
                                    html: o.msg,
                                    closable: true,
                                    align: 't',
                                    slideInDuration: 400,
                                    minWidth: 400
                                });
                            }else{
                                Ext.toast({
                                    html: 'SMS gesendet',
                                    closable: true,
                                    align: 't',
                                    slideInDuration: 400,
                                    minWidth: 400
                                });
                            }
                        }
                    });
                }
            }
        }
    ]
});


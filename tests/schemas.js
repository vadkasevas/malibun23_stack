import { assert } from 'meteor/practicalmeteor:chai';

if(Meteor.isServer) {
        describe('Schemas', () => {
            beforeEach(() => {});
            afterEach(() => {});

            it(`esCode Невалидный код test ^ 7 & dwd;`, function(done){
                var schema = new SimpleSchema({
                    code:Schemas.esCode({label:'JS код'})
                });
                try {
                    schema.validate({
                        code:'test dwd'
                    });
                }catch(e){
                    console.log(e);
                    return done();
                }
                return done(new Error('Код должен быть невалидным'));
            });

            it(`esCode Валидный код this.test;`, function(done){
                var schema = new SimpleSchema({
                    code:Schemas.esCode({label:'JS код'})
                });
                try {
                    schema.validate({
                        code:'this.test;'
                    });
                    return done();
                }catch(e){
                    return done(e);
                }
            });

            it(`esCode custom`, function(done){
                var schemaMessage = function(msg){
                    var key = md5(msg);
                    SimpleSchema.messages({
                        [key]:msg
                    });
                    return key;
                };

                var schema = new SimpleSchema({
                    code:Schemas.esCode({label:'JS код',custom(){
                        return schemaMessage('Custom error');
                        }})
                });
                try {
                    schema.validate({
                        code:'this.test;'
                    });
                    return done(new Error('Custom error not working'));
                }catch(e){
                    return done();
                }
            });
        });
}
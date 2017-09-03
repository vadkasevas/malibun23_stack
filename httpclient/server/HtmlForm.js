var htmlspecialchars_decode = function(s) {
    return String(s).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
};

HtmlForm = new function(){
    var getAttributeValue = function(attr,attrsText){
        var re = new RegExp('\\s'+attr+'\\s*=\\s*[\'"]([^\'"]*)', 'i');
        var match = re.exec(attrsText);
        if(match)
            return match[1];
        return null;
    };

    this.findAll = function(baseUrl,html){
        var formRe = /<form[\s\S]*?<\/form>/gi;
        var attrsTextRe = /<form([^>]+)>/i;
        var result = [];
        while(true){
            var match = formRe.exec(html);
            if(match){
                var formHtml = match[0];
                var attrsText = '';
                var attrsMatch = attrsTextRe.exec(formHtml);
                if(attrsMatch){
                    attrsText = attrsMatch[1];
                }
                var formAction = htmlspecialchars_decode( getAttributeValue('action',attrsText) || '' );
                formAction = HttpClient.resolveUrl(baseUrl,formAction);
                var formMethod = getAttributeValue('method',attrsText) || HttpClient.METHOD_GET;
                formMethod = formMethod.toUpperCase();
                var inputsRe = /<\s*input\s+([^>]+)>/gi;
                var inputs = {};
                while(true){
                    var inputMatch = inputsRe.exec(formHtml);
                    if(inputMatch){
                        var inputHtml = inputMatch[0];
                        var inputName=null;
                        var inputValue = '';

                        var inputNameRe = /\s+name\s*=\s*['"]?([^'"]+)/i;
                        var inputNameMatch =  inputNameRe.exec(inputHtml);
                        if(inputNameMatch){
                            inputName = inputNameMatch[1];
                        }

                        var inputValueRe = /\s+value\s*=\s*['"]?([^'"]+)/i;
                        var inputValueMatch =  inputValueRe.exec(inputHtml);
                        if(inputValueMatch){
                            inputValue = inputValueMatch[1];
                        }

                        if(inputName){
                            inputs[inputName] = inputValue;
                        }
                    }else
                        break;
                }

                var textAreaRe = /<textarea[^>]*>([\s\S]*?)<\/textarea>/gim;
                while(true){
                    var textareaHtml = safeGet(textAreaRe.exec(formHtml),0,'');
                    if(!textareaHtml)
                        break;
                    var textareaName = safeGet(/<\s*textarea[^>]*\s+name\s*=\s*['"]?([^<>'"]+)/i.exec(textareaHtml) , 1 , '' );
                    var textareaValue = htmlspecialchars_decode( safeGet(/<\s*textarea[^>]*>([^>]+)/i.exec(textareaHtml) , 1 , '' ) );
                    if(textareaName)
                        inputs[textareaName] = textareaValue;
                }

                result.push({
                    action:formAction,
                    method:formMethod,
                    id:getAttributeValue('id',attrsText)||'',
                    name:getAttributeValue('name',attrsText)||'',
                    inputs:inputs,
                    html:formHtml
                });

            }else
                break;
        }
        return result;
    };

    this.findOne = function(baseUrl,html){
        var forms = this.findAll(baseUrl,html);
        if(forms.length>0)
            return forms[0];
        return null;
    };

    this.byName = function(baseUrl,html,name){
        var forms = this.findAll(baseUrl,html);
        return _.find(forms,function(form){return form.name==name});
    };

    this.byId = function(baseUrl,html,id){
        var forms = this.findAll(baseUrl,html);
        return _.find(forms,function(form){return form.id==id});
    };
};
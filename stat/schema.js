MalibunStats.schema = new SimpleSchema({
    type:{type:String,optional:true,defaultValue:null},
    label:{type:String},
    root:{type:String,optional:true,defaultValue:null},
    precision:{type:Number,min:1,label:'Точность, сек'},
    date_from:{type:Date,label:'Дата от'},
    date_to:{type:Date,label:'Дата до'},
    expires:{type:Date,label:'Дата истечения'},

    data:{type:Object,blackbox:true}
});


var gulp = require('gulp'),
    less = require('gulp-less'),//less编译
    concat = require("gulp-concat"),//文件合并
    minifyCss= require("gulp-minify-css"),//css压缩
    rename = require("gulp-rename"),//文件重命名
    del = require('del'),//文件删除
    livereload = require('gulp-livereload'),//刷新页面
    uglify = require("gulp-uglify"),//js压缩
    imagemin = require('gulp-imagemin'),//jpg,png,gif图片压缩
    pngquant = require('imagemin-pngquant'),//png图片压缩插件(平均压缩2k);
    connect = require("gulp-connect"),//静态服务器，用于移动端访问页面
    order = require("gulp-order"),//指定文件顺序，合并文件的时候
    //====解决less编译出错，管道崩溃的问题
    plumber = require('gulp-plumber'),//Briefly it replaces pipe method and removes standard onerror handler on error event, which unpipes streams on error by default.
    notify = require('gulp-notify');//
/*
var LessPluginAutoPrefix = require('less-plugin-autoprefix');
var autoprefix = new LessPluginAutoPrefix({
    browsers: ["last 5 versions"],
    cascade: true
});*/
//gulp-css-spriter 将css中的icon合并成雪碧图
var cssName = "lanzuan_mobile";
//less
//处理同步任务
//less编译构建任务
gulp.task("less",function(cb){
    return gulp.src("src/less/lanzuan_mobile.less")
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(less())
        .pipe(concat("lanzuan_mobile.css"))
        .pipe(gulp.dest('dist/css/'))
        .pipe(livereload());
});
//压缩，发布任务
gulp.task("cssMinify",function(){
    return gulp.src("dist/css/lanzuan_mobile.css")
        .pipe(minifyCss())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest("dist/css"))
        .pipe(livereload());
});
//默认任务
gulp.task("default",function(){
    gulp.watch(['src/less/**/*.less'], ["less"]);
    //TODO:禁用图片压缩，每次都压缩。以后用compass（sass）的时候再解决
    //gulp.watch(['src/images/**/*'],["imgMini"]);
    //TODO：监控js，压缩合并
    gulp.watch(["src/js/**/*"],["jsMinify"]);
    gulp.start("server");
});
gulp.task("public",function(){
    //css压缩
    gulp.start(["cssMinify","jsMinify"]);
    //修改路径 压缩后修改 lanzuan_mobile.css-->lanzuan_mobile.min.css,lanzuan_mobile.js---->lanzuan_mobile.min.js
    //cdn 修改css中的所有url路径为cdn路径
});
//启动服务器
gulp.task('watchHtml', function () {//创建watch任务去检测html文件,其定义了当html改动之后，去调用一个Gulp的Task
    gulp.watch(['./view/**/*.html'], ['html']);
});
//使用connect启动一个Web服务器
gulp.task('connect', function () {
    connect.server({
        livereload: true,port:9000
    });
});
gulp.task('html', function () {//清除缓存
    gulp.src('./view/**/*.html')
        .pipe(connect.reload());
});
gulp.task('server', ['connect', 'watchHtml']);

//js concat
gulp.task('jsMinify',["orderConcat"], function () {
   return gulp.src('dist/js/lanzuan_mobile.js')
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('dist/js'))
        .pipe(livereload());
});
/**
 *
 *
 *  <script src="../../src/zepto.js"></script>
 <script src="../../src/event.js"></script>
 <script src="../../src/ie.js"></script>
 <script src="../../src/touch.js"></script>
*/
gulp.task('orderConcat',function(){
    return gulp.src("src/js/**/*.js")
        .pipe(order([
            "lib/zepto/zepto.js",
            "lib/zepto/callback.js",
            "lib/zepto/selector.js",
            "lib/zepto/data.js",
            "lib/zepto/event.js",
            "lib/zepto/touch.js",
            "lib/zepto/ie.js",
            "lib/zepto/form.js",
            "lib/zepto/deffered.js",
            "lib/zepto/ajax.js",
            "lib/zepto/fx.js",
            "lib/zepto/fx_method.js",
            "banner.js",
            "common.js"
        ]))
/*
        .pipe(order(["lib/zepto.min.js","lib/event.js","lib/lib.js","common.js"]))
*/
        .pipe(concat("lanzuan_mobile.js"))
        .pipe(gulp.dest("dist/js"));
});
//图片压缩
gulp.task('imgMini', function () {
    del(['dist/images/**/*']);
    gulp.src('src/images/**/*')
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(imagemin({
            progressive: true,
            use: [pngquant()]
        }))
        .pipe(gulp.dest('dist/images'))
        .pipe(livereload());
});
/**
 * 合并雪碧图的功能：
 * 并不是把所有的图片都合成在一起，只是把需要合成在一起的图片合成一起
 * 需要一个可配置的
 *
 */

//合并雪碧图，自动生成适应屏幕尺寸的图标
var runSequence = require('gulp-run-sequence');//顺序执行任务
/*gulp.task('prod', function(cb) {
    runSequence('clean', 'compass', ['image', 'style', 'html'], 'ftp', cb);
});*/

/**
 * products 产品列表
 * product 产品详情
 */

/*gulp.task('autoSprite', function(cb) {
    //console.log(listA);
    runSequence(listA, cb);
});*/

//帮助说明
gulp.task("help",function(){
    console.log("gulp               默认less,images监控,server启动");
    console.log("gulp autoSprite    发布项目之前需要执行此task,把图片合并成雪碧图,只有pc端可以使用");
    console.log("gulp public        发布项目css,js压缩");
});

//
var gulpif = require('gulp-if');
var minimist = require('minimist');
var cssSprite = require("gulp-css-spritesmith");
var basePath1 ="assest/images/";
var baseDistPath="../../assest/images/";
var slicePath ="/slice";
var pngMap=["products","product","datepicker","dialog","icons","index","help","checkbox"];
var knownOptions = {
    string: 'path',
    default: { env: process.env.NODE_ENV || 'production' }
};
var options = minimist(process.argv.slice(2), knownOptions);
gulp.task('autoSprite', function() {
    var name = options.path;
    var src = basePath1+name+slicePath;
    var dest = basePath1+name;
    var path = baseDistPath+name;
    console.log(name+"|"+src+"|"+dest+"|"+path);
    gulp.src('dist/css/lanzuan_mobile.css').pipe(cssSprite({
            // sprite背景图源文件夹，只有匹配此路径才会处理，默认 images/slice/
            imagepath:src,
            // 映射CSS中背景路径，支持函数和数组，默认为 null
            imagepath_map: null,
            // 雪碧图输出目录，注意，会覆盖之前文件！默认 images/
            spritedest: dest,
            // 替换后的背景路径，默认 ../images/
            spritepath:path,
            // 各图片间间距，如果设置为奇数，会强制+1以保证生成的2x图片为偶数宽高，默认 0
            padding: 2,
            // 是否使用 image-set 作为2x图片实现，默认不使用
            useimageset: false,
            // 是否以时间戳为文件名生成新的雪碧图文件，如果启用请注意清理之前生成的文件，默认不生成新文件
            newsprite: false,
            // 给雪碧图追加时间戳，默认不追加
            spritestamp: true,
            // 在CSS文件末尾追加时间戳，默认不追加
            cssstamp: true
        })).pipe(gulp.dest(''))
            .pipe(livereload());
});


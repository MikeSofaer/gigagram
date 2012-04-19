

var images = document.getElementsByTagName('img'),
    hiddenImageIndex = 0,
    hideInterval = null,
    createFilter = function(getPixel) {

        return function(canvas) {

            var width = canvas.width,
                height = canvas.height,
                context = canvas.getContext('2d'),
                imageData = context.getImageData(0, 0, width, height),
                data = imageData.data,
                args = Array.prototype.slice.call(arguments, 1),
                i,
                j;

            for(i = 0; i < height; i++)
                for(j = 0; j < width; j++)
                    (function() {

                        var index = (i*width*4) + (j*4),
                            rgb = getPixel(
                                data[index],
                                data[index + 1],
                                data[index + 2],
                                data[index + 3],
                                args
                            );

                        data[index]     = rgb.r;
                        data[index + 1] = rgb.g;
                        data[index + 2] = rgb.b;  
                        data[index + 3] = rgb.a;
                    })();


            context.putImageData(imageData, 0, 0);
        };
    },
    safe = function(i) {
        return Math.min(255, Math.max(0, i));
    },
    saturation = createFilter(function(r, g, b, a, args) {

        var avg = ( r + g + b ) / 3,
            t = args[0];

        return {
            r: safe(avg + t * (r - avg)),
            g: safe(avg + t * (g - avg)),
            b: safe(avg + t * (b - avg)),
            a: a
        };
    }),
    contrast = (function() {

        var calc = function(f, c) {
                return (f-0.5) * c + 0.5;
            };

        return createFilter(function(r, g, b, a, args) {

            var val = args[0];

            return {
                r: safe(255 * calc(r / 255, val)),
                g: safe(255 * calc(g / 255, val)),
                b: safe(255 * calc(b / 255, val)),
                a: a 
            };
        });
    })(),
    tint = createFilter(function(r, g, b, a, args) {
        
        var maxRGB = args[1],
            minRGB = args[0];

        return {
            r: safe((r - minRGB[0]) * ((255 / (maxRGB[0] - minRGB[0])))),
            g: safe((g - minRGB[1]) * ((255 / (maxRGB[1] - minRGB[1])))),
            b: safe((b - minRGB[2]) * ((255 / (maxRGB[2] - minRGB[2])))),
            a: a
        };
    }),
    canvasFromImage = function(image) {

        var canvas = document.createElement('canvas'),
            context = canvas.getContext('2d');

        canvas.width = image.width;
        canvas.height = image.height;

        context.drawImage(image, 0, 0);

        console.log(image.width + ' - ' + image.height);

        canvas.applyToImage = function() {

            image.src = canvas.toDataURL();
        };

        return canvas;
    };


window.addEventListener('load', function() {

    Array.prototype.slice.call(images).forEach(function(image) {

        var canvas = canvasFromImage(image);

        // Filter the image..
        saturation(canvas, 0.4);
        contrast(canvas, 0.75);
        tint(canvas, [20, 35, 10], [150, 160, 230]);

        canvas.applyToImage();
    });

}, true);

CloudFlare.define("instaflare", ["cloudflare/iterator", "cloudflare/dom", "cloudflare/console", "instaflare/config"], function(iterator, dom, console, _config) {
    var instaflare = {};
    instaflare.filterHelpers = {
        safe: function(i) {
            return Math.min(255, Math.max(0, i));
        },
        calc: function(f, c) {
            return (f-0.5) * c + 0.5;
        }
    };

    instaflare.createFilter = function(getPixel) {
        function processPixel(data, i,j,width, options){
            var index = (i*width*4) + (j*4),
                        rgb = getPixel(
                            data[index],
                            data[index + 1],
                            data[index + 2],
                            data[index + 3],
                            options
                        );

                    data[index]     = rgb.r;
                    data[index + 1] = rgb.g;
                    data[index + 2] = rgb.b;
                    data[index + 3] = rgb.a;
        }

        return function(canvas) {
            var width = canvas.width,
                height = canvas.height,
                context = canvas.getContext('2d'),
                imageData = context.getImageData(0, 0, width, height),
                data = imageData.data,
                options = Array.prototype.slice.call(arguments, 1),
                i,
                j;

            for(i = 0; i < height; i++)
                for(j = 0; j < width; j++)
                    processPixel(data, i, j,width, options);
            context.putImageData(imageData, 0, 0);
        };
    }

    instaflare.filterParts = {
        saturation: instaflare.createFilter(function(r, g, b, a, args) {
            var avg = ( r + g + b ) / 3,
                t = args[0];

            return {
                r: instaflare.filterHelpers.safe(avg + t * (r - avg)),
                g: instaflare.filterHelpers.safe(avg + t * (g - avg)),
                b: instaflare.filterHelpers.safe(avg + t * (b - avg)),
                a: a
            };
        }),
        contrast: instaflare.createFilter(function(r, g, b, a, args) {
            var val = args[0];

            return {
                r: instaflare.filterHelpers.safe(255 * instaflare.filterHelpers.calc(r / 255, val)),
                g: instaflare.filterHelpers.safe(255 * instaflare.filterHelpers.calc(g / 255, val)),
                b: instaflare.filterHelpers.safe(255 * instaflare.filterHelpers.calc(b / 255, val)),
                a: a
            };
        }),
        tint: instaflare.createFilter(function(r, g, b, a, args) {
            var maxRGB = args[1],
                minRGB = args[0];
            return {
                r: instaflare.filterHelpers.safe((r - minRGB[0]) * ((255 / (maxRGB[0] - minRGB[0])))),
                g: instaflare.filterHelpers.safe((g - minRGB[1]) * ((255 / (maxRGB[1] - minRGB[1])))),
                b: instaflare.filterHelpers.safe((b - minRGB[2]) * ((255 / (maxRGB[2] - minRGB[2])))),
                a: a
            };
        })
    }

    instaflare.canvasFromImage = function(image) {
        var canvas = document.createElement('canvas'),
            context = canvas.getContext('2d');

        canvas.width = image.width;
        canvas.height = image.height;

        context.drawImage(image, 0, 0);

        canvas.applyToImage = function() {
            image.src = canvas.toDataURL();
        };

        return canvas;
    };

    instaflare.filters = {
        chrisify: function(image) {
            var canvas = instaflare.canvasFromImage(image);

            instaflare.filterParts.saturation(canvas, 0.4);
            instaflare.filterParts.contrast(canvas, 0.75);
            instaflare.filterParts.tint(canvas, [20, 35, 10], [150, 160, 230]);

            canvas.applyToImage();
        },
        matthusiasm: function(image) {
            var canvas = instaflare.canvasFromImage(image);

            instaflare.filterParts.saturation(canvas, 0.6);
            instaflare.filterParts.tint(canvas, [200, 35, 100], [50, 80, 200]);

            canvas.applyToImage();
        }
    }

    instaflare.canvasIsSupported = (function() {

        var canvas = document.createElement('canvas');
        return !!(canvas.getContext && canvas.getContext('2d'));
    })(),

    instaflare.flare = function(filter){

        if(instaflare.canvasIsSupported) {

            var images = document.getElementsByTagName('img');
            var sliced = Array.prototype.slice.call(images);

            iterator.forEach(images, function(image) {
                instaflare.filters[filter](image)
            });
        }
    }

    dom.addEventListener(window, 'load', function() {
        instaflare.flare(_config.filter);
    }, true);
    return instaflare;
});


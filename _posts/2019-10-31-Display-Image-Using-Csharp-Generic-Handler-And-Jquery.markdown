---
layout: post
title:  "Display Image as ByteArray Using C# Generic Handler and JQuery"
date:   2019-10-31 09:10:00 -0500
categories: dotnet csharp
tags: Files Image JQuery Handler
comments: true
---

This is a quick and simple demo of **image processing** in C# using **Generic Handler** and **JQuery**. This can be used to dynamically update images on your page. <!--more-->

___
## Application Demo
Basically, the application displays a *Submit* button. After you click it, it simply displays an image below it.

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/48991670222/in/dateposted-public/" title="jquery-2"><img src="https://live.staticflickr.com/65535/48991670222_1acb608cf0_n.jpg" width="640" height="auto" alt="jquery-2"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

___
### Setup

Using Visual Studio, create an ASP.NET Web Application (I am using .NET Framework instead of Core). Then, create a Generic Handler, just call it *Handler.ashx* for simplicity.

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/48981125702/in/album-72157711535844827/" title="Studio-Banner-2"><img src="https://live.staticflickr.com/65535/48981125702_855a3313bd_n.jpg" width="640" height="210" alt="Studio-Banner-2"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

Also create a Razor Web Page, and call it index.cshtml.

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/48991433781/in/dateposted-public/" title="handler-4"><img src="https://live.staticflickr.com/65535/48991433781_82246525b7_n.jpg" width="640" height="212" alt="handler-4"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

My project looks like this:

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/48990981413/in/dateposted-public/" title="jquery-3"><img src="https://live.staticflickr.com/65535/48990981413_ea1ed93d0d_n.jpg" width="259" height="320" alt="jquery-3"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

Notice that I also created an **image** folder with subfolders in it: **biology, default, math** and **physics**. For this demo, I'm only testing the *biology* subfolder, which contains 3 images.

___

## The Generic Handler

The generic handler is simple. It just returns a a bytearray representation of the image. The source code for my Handler.ashx looks like this.

```
public void ProcessRequest(HttpContext context)
{
    context.Response.Cache.SetCacheability(HttpCacheability.Public);
    context.Response.ContentType = "image/jpeg";
    string rootDir = System.Web.Hosting.HostingEnvironment.ApplicationPhysicalPath;

    string imagePath = Path.Combine(rootDir, @"images\biology\biology-2.jpg");
    
    byte[] byteArray = File.ReadAllBytes(imagePath);
    context.Response.BinaryWrite(byteArray);
}
```
#### Brief Explanation
```
context.Response.Cache.SetCacheability(HttpCacheability.Public);
```
The Cacheability is set to either private or public. I'm using **Public** so that it's caheable in both browser and proxy server.
```
context.Response.ContentType = "image/jpeg";
```
Obviously, we set it to image content type.
```
string rootDir = System.Web.Hosting.HostingEnvironment.ApplicationPhysicalPath;
```
The *rootDir* variable is my application's absolute path, something like *C:\Users\avasay\Projects\GetImageHandler\*.  I then combine it with the relative path of my image. I'm hard-coding it for now for simplicity.

```
string imagePath = Path.Combine(rootDir, @"images\biology\biology-2.jpg");
```
Finally, this code
```
byte[] byteArray = File.ReadAllBytes(imagePath);
```
will go to the path of the image we specified, read the image and load it in the memory as array bytes, ready to be sent as image to the browser.

___
## The Index Page
The source code for the index.cshtml looks like this.
```
<!DOCTYPE html>
<html>
<head>
    <title></title>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.2/jquery.min.js"></script>
    <style>
        div#container img {
            width: 640px;
            height: auto;
        }
    </style>
    <script>
        $(document).ready(function () {
            $("#submit").on('click', function (e) {
                $("#container").append($('<img/>', { src: 'https://localhost:44350/Handler.ashx'}));

            });
        });
    </script>
</head>
<body>
    <button id="submit">Submit</button>
    <div id="container"></div>
</body>
</html>
```

#### Brief Explanation
As I mentioned above, the page only contains a button. It also has a div that will contain our image.
```
<body>
    <button id="submit">Submit</button>
    <div id="container"></div>
</body>
```
When you click the button, the javascript kicks in. 

The jquery code itself is simple. 
```
$(document).ready(function () {
    $("#submit").on('click', function (e) {
        $("#container").append($('<img/>', { src: 'https://localhost:44350/Handler.ashx'}));

    });
});
``` 
Basically, we make a call to Handler.ashx directly and use the returned value for our image source. Finally, we append the img element to our div element.  

### And that's it!
Hopefully, this is helpful to someone. Below, I explain an alternative way of displaying the image without using JQuery. 

___
## Display Image As Background
This is an easier way to display an image. **As a background!** This also saves you from using javascript. Basically, you simple call the handler via the background property.
```
<body>
    <div style="background: url('Handler.ashx') no-repeat; height: 800px; width: 100%; background-size: contain;">
    </div>
</body>
```
This technique can be used to display banners on your homepage, that is, banners that change on refresh.  In my next couple of posts, I will demo such application, which dynamically changes the image on a page using cached images.

### Source Code
Download source code **[here][project-download]**. This project was created in Visual Studio Community 2019.

[project-download]: https://github.com/avasay/GetImageHandler
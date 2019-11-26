---
layout: post
title:  "Image Randomizer Using Caching in C#"
date:   2019-11-01 07:10:00 -0500
categories: dotnet csharp
tags: caching rotator
comments: true
---



This is a simple image **randomizer**/**rotator** application implemented in C# and using generic handler. This application continues from and builds on my the two applications from my previous posts<!--more-->: 

1. Caching a list from my [Get Random Element From Cached List][get-random-element] post; and 
2. Displaying a bytearray image from my [Display Image Using CSharp Generic Handler and JQuery][display-image] post. 

Except, this time I'm not using JQuery to display images inside the ```<img>``` tag. This time, I simply display them as a background, like so, 
```
<div style="background: url('GetImageHandler.ashx?subject=biology');"></div>
```
Basically, the application works by reading all the filenames from a local directory and then caching the filenames. Application picks a random filename, reads it into memory as bytearray, and sends its way to the browser for display. On browser refresh, application picks another random file from the cache, and so on and so forth. 

I divided this post into Part 1 and Part 2. Part 2 is on this same post at the bottom page. I'm doing this to emphasize the sequence of caching in the application. 
1. **Part 1**. Demonstrates caching of the directory "info". This means that I am caching a list of filenames. This is important as the first step because it minimizes the file system access. After you finished Part 1, the application should be up and running regardless of Part 2. You will be able to display random images on the browser.
2. **Part 2**. Demonstrates caching of the images referred to by those filenames. The image is cached as a bytearray as soon as we randomly picked its name from the list; then we sent it to the browser for display. Here, I created a class to represent an image object; and then, I added a routine to cache this object.

**The important lesson is this**: if you're caching your images for browser display, you don't want to cache everything at once. You only cache what you display; otherwise, you will run out of space. 

### Source Code
Download source code **[here][project-download]**. This project was created in Visual Studio Community 2019.

___
## Application Demo

This application is very similar to websites that rotate their hero banner on their homepage on refresh. Check out [Tarrant County College][tccd-site] website that does the same thing. For my example, imagine a college website that offers courses in Biology, Math, and Physics. The Biology homepage, for example, will have rotating banners in which the banners are Biology-related only. Same hold true for Math and Physics, each of their homepages would only display banners related to their respective subjects. When you call the application in the browser, it would look like this,

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/48995755411/in/dateposted-public/" title="randomizer-2"><img src="https://live.staticflickr.com/65535/48995755411_e4f26ac9eb_n.jpg" width="640" height="auto" alt="randomizer-2"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

On refresh, you should get a different image. You may get the same one as the last one if you have very few images in the cache.

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/48995211373/in/dateposted-public/" title="randomizer-3"><img src="https://live.staticflickr.com/65535/48995211373_bd2cfcd2fc_n.jpg" width="640" height="auto" alt="randomizer-3"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

On another refresh, another image.

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/48995211353/in/dateposted-public/" title="randomizer-1"><img src="https://live.staticflickr.com/65535/48995211353_9da87c5dc1_n.jpg" width="640" height="auto" alt="randomizer-1"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

___
## Part 1


### Project Setup

The application is a C# generic handler that the user calls within Razor page. 

In Visual Studio, create the following: 
1. **A web application**, *ASP.NET Web Application (.NET Framework)*. You can call it whatever. I called my application, *FrameworkWebApplication2*.
2. **A generic handler**, and simply call it *GetImageHandler.ashx*. 
3. **A class** called *DirInfoCacher.cs* - this one is not necessary though. I just wanted the caching logic separate from the handler.
4. **A Web Razor Page**, which I name *index.cshtml*.

My project is organized like this:

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49084986833/in/dateposted-public/" title="randomizer-8"><img src="https://live.staticflickr.com/65535/49084986833_6a217d0ff1_o.jpg" width="337" height="348" alt="randomizer-8"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

Note that I also created an **images\banners** folders, with 4 subfolders under it, namely, **biology, default, math,** and **physics**. I also put 3 images in the biology folder. For this demo, I am only going to process the images inside the biology folder. 

___
## Index Page
The index page for this demo is very simple. It simply contains the following code. You may choose to create a separate style block for height, width, etc. But I'm simplifying it for this demo.
```
<html>
<head>
    <title>Random Banner Demo</title>
</head>
<body>
    <div style="background: url('GetImageHandler.ashx?subject=biology') no-repeat; height: 800px; width: 100%; background-size: contain;">
    </div>

</body>
</html>
```

___
## Program Flow
The program flow for the generic handler goes like this:
```
A. 
    Read value of QueryString["subject"]  
        e.g., QueryString["subject"]=biology
   
    Check if "biology" directory exists
    if not exist then use a default directory
   
B.
    Check if "biology" directory cache exists
    If cache doesn't exist
       Build the cache
       Pick a random image
    else if directory cache exists 
       Pick a random image from cache

    Return image to html page
```

During the course of coding this, I decided to separate the caching part (part **B** above) into its own class to make the handler class (**A**) a little cleaner.

___
## The Handler

The code listing for the code-behind, *GetImageHandler.ashx.cs*, is shown below:
```
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace ImageRandomizer
{
    /// <summary>
    /// Summary description for Handler
    /// </summary>
    public class Handler : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            context.Response.Cache.SetCacheability(HttpCacheability.Public);
            context.Response.ContentType = "image/jpeg";
            string rootDir = System.Web.Hosting.HostingEnvironment.ApplicationPhysicalPath;

            string userFolder = string.Empty;

            if (context.Request.QueryString["subject"] != null)
            {
                userFolder = Path.Combine(@"images\banners", context.Request.QueryString["subject"]);
            }
            else
            {
                userFolder = @"images\banners\default";
            }


            DirInfoCacher dirInfoCacher = new DirInfoCacher(Path.Combine(rootDir, userFolder));

            string pickedImage = dirInfoCacher.pickedImagePath;

            if (pickedImage == "")
            {
                context.Response.ContentType = "text/plain";
                context.Response.Write("");
            }
            else
            {
                ImageCacher imageCacher = new ImageCacher(pickedImage);

                byte[] byteArray = imageCacher.GetImage();
                context.Response.BinaryWrite(byteArray);
            }

        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}
```

### Brief explanation
The code below says that the caching is enabled in both the client browser and the proxy server.

```
context.Response.Cache.SetCacheability(HttpCacheability.Public);
```

The code below says the handler servers content type of image.
```
context.Response.ContentType = "image/jpeg";
```

After reading the subject querystring, I combine the image path(local direcory) to the subject.
```
userFolder = Path.Combine(@"images\banners", context.Request.QueryString["subject"]);
``` 

creating a path that looks something like, **images\banners\biology**. Note also, that I provided a default directory when the caller of the handler does not provide a value for the subject.

We, then, create an instance of the directory cacher class called, DirInfoCacher,
```
DirInfoCacher dirInfoCacher = new DirInfoCacher(Path.Combine(rootDir, userFolder));
```
We then GET the value of the *pickedImagePath* member, which is the actual random image file.
```
string pickedImage = dirInfoCacher.pickedImagePath;
```
Finally, take note that DirInfoCacher returns an empty string if for some reason the directory path does not exist, or the directory is empty.
```
if (pickedImage == "")
{
    context.Response.ContentType = "text/plain";
    context.Response.Write("");
}
else
{
    byte[] byteArray = File.ReadAllBytes(pickedImage);
    context.Response.BinaryWrite(byteArray);
}
```

___
## Directory Cacher Class

The directory cacher class, *DirInfoCacher*, looks like this.
```
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace ImageRandomizer
{
    public class DirInfoCacher
    {
        public string pickedImagePath { get; set; }

        public DirInfoCacher(string path)
        {
            pickedImagePath = PickImage(path);
        }

        private string PickImage(string path)
        {
            string pickedImage = string.Empty;
            object cacheList = HttpRuntime.Cache.Get(path) as List<string>;

            if (cacheList == null)
            {
                pickedImage = BuildCache(path);
            }
            else
            {
                pickedImage = PickFromCache(cacheList);
            }
            return pickedImage;
        }

        private string BuildCache(string path)
        {
            // Get a list of files from the given path
            var extensions = new string[] { ".png", ".jpg", ".gif" };
            var dirInfo = new DirectoryInfo(path);

            if (!dirInfo.Exists)
            {
                return "";
            }

            List<System.IO.FileInfo> fileInfoList = dirInfo.GetFiles("*.*").Where(f => extensions.Contains(f.Extension.ToLower())).ToList();

            if (fileInfoList.Count() != 0)
            {
                // Pick random file
                Random R = new Random();
                string imagePath = string.Empty;
                int randomNumber = R.Next(0, fileInfoList.Count());
                imagePath = fileInfoList.ElementAt(randomNumber).FullName;

                // Now, put all files in the Dictionary
                List<string> fileInfo2string = fileInfoList.Select(f => f.FullName.ToString()).ToList();
                HttpRuntime.Cache.Insert(path, fileInfo2string, null, DateTime.Now.AddMinutes(60d), System.Web.Caching.Cache.NoSlidingExpiration);
                return imagePath;
            }
            else
            {
                return "";
            }
        }

        private string PickFromCache(object cacheList)
        {
            IList<string> collection = (IList<string>)cacheList;

            // Pick random file
            Random R = new Random();
            string imagePath = string.Empty;
            int randomNumber = R.Next(0, collection.Count());
            imagePath = collection.ElementAt(randomNumber);
            return imagePath;
        }
    }
}
```
### Brief Explanation
Similar to my previous post on caching, my cacher is divided into two major logical parts, as shown below.
```
private string PickImage(string path)
{
    string pickedImage = string.Empty;
    object cacheList = HttpRuntime.Cache.Get(path) as List<string>;

    if(cacheList == null)
    {
        pickedImage = BuildCache(path);
    }
    else
    {
        pickedImage = PickFromCache(cacheList);
    }
    return pickedImage;
}
```
The first part is to build the cache and pick a random image. The second part simply picks from the already existing cache. The ```(cacheList == null)``` condition is only TRUE the first time the application is run, otherwise it will always go to the ```else``` condition.

#### Building the Cache

Inside the ```BuildCache()``` function, we first check if the path provided exists or not,
```
var dirInfo = new DirectoryInfo(path);
```
If it does not exist, we just return an empty string. Otherwise, we find all the files within that directory,
```
List<System.IO.FileInfo> fileInfoList = dirInfo.GetFiles("*.*").Where(f => extensions.Contains(f.Extension.ToLower())).ToList();
```
Notice above that we are looking for image files with extensions that we specified, and store these filenames in a List<>. 

The code that follows is just something I recycled from my previous post on [picking random element from a cached list][get-random-element]. First off, the following code looks for a random number from 0 to ```fileInfoList.Count()```. 
```
int randomNumber = R.Next(0, fileInfoList.Count());
```
Take note that ```Next()``` actually returns numbers from 0 to ```Count()-1```. So, in my case, because I only have three images in my folder, I get numbers from 0 to 2. 

After this, we use this randomNumber as an index to our list as in,
```
imagePath = fileInfoList.ElementAt(randomNumber).FullName;
```
Also, take note that we get the full path to the image. 

The subsequent code,
```
List<string> fileInfo2string = fileInfoList.Select(f => f.FullName.ToString()).ToList();
```
converts our list to a list of string. Then, we pass this list in the ```Cache.Insert``` method as in,

```
HttpRuntime.Cache.Insert(path, fileInfo2string, null, DateTime.Now.AddMinutes(60d), System.Web.Caching.Cache.NoSlidingExpiration);
```
Here, we use the directory path (not the image path, but image's parent folder) as the name of our cache. Also, notice that I'm using an absolute expiration of 60 minutes. When you use an absolute expiration, you always use ```NoSlidingExpiration``` for the last parameter.

#### Picking From Cache
If the cache already exists, we just pick from a random file from it. But before it picks a random file, it first reads the cache as a list of string, like so,
```
IList<string> collection = (IList<string>)cacheList;
```
After this, we pick a random file from the cache.
```
int randomNumber = R.Next(0, collection.Count());
imagePath = collection.ElementAt(randomNumber);
```

### That's It!

You can run the program as it is. It will display random images on your browser even without doing Part 2; except of course, the images are always read from the file system. 

### Source Code
Download source code **[here][project-download]**. This project was created in Visual Studio Community 2019.

___
## Part 2
Here, in Part 2, I will extend this application to demonstrate how to cache the image itself as a bytearray as soon as they are picked for display.

### ImageCacher Class
The ImageCacher class is responsible for creating and caching an image object. Very simple responsibility really. In fact, all it does is take the filename from our handler, and return a bytearray of the image back to the handler. Of course it stores the image in the cache if it's not already in it. 

In your Visual Studio project, add a class called *ImageCacher.cs*. The ImageCacher class looks like this:
```
public class ImageCacher
{
    private string m_pickedImagePath = string.Empty;
    private ImageObject m_imageObject = null;

    public ImageCacher(string pickedImage)
    {
        m_pickedImagePath = pickedImage;
        m_imageObject = HttpRuntime.Cache.Get(m_pickedImagePath) as ImageObject;
    }

    public byte[] GetImage()
    {
        if (m_imageObject == null)
        {              
            DateTime ourFileDate = File.GetLastWriteTime(m_pickedImagePath);
            ourFileDate = ourFileDate.AddMilliseconds(-ourFileDate.Millisecond);

            byte[] byteArray = File.ReadAllBytes(m_pickedImagePath);
            m_imageObject = new ImageObject(m_pickedImagePath, "image/jpeg", byteArray, ourFileDate);
            HttpRuntime.Cache.Insert(m_pickedImagePath, m_imageObject, null, System.Web.Caching.Cache.NoAbsoluteExpiration, System.Web.Caching.Cache.NoSlidingExpiration);               
        }
                    
        return m_imageObject.Content;          
    }

}
```

### The ImageObject Class
In the same file, add the ImageObject class.
```
public class ImageObject
{
    public string FileName { get; set; }
    public string ContentType { get; set; }
    public byte[] Content { get; set; }
    public DateTime SubmitDate { get; set; }

    public ImageObject(string fn, string tp, byte[] ct, DateTime dt)
    {
        FileName = fn;
        ContentType = tp;
        Content = ct;
        SubmitDate = new DateTime(dt.Year, dt.Month, dt.Day, dt.Hour, dt.Minute, dt.Second, 0, DateTimeKind.Utc);
    }
}
```
You may need to add ```using System.IO``` for using ```File``` object.

### How to use the Image Cacher
We call the image cacher inside **GetImageHandler.ashx.cs**, as I have mentioned. We will need to replace what's inside our else block in code.
```
if (pickedImage == "")
{
    context.Response.ContentType = "text/plain";
    context.Response.Write("");
}
else
{
    byte[] byteArray = File.ReadAllBytes(pickedImage);
    context.Response.BinaryWrite(byteArray);
}
```
So, instead of reading the bytes ourselves, we call the ImageCacher to do it for us. So, that the else block changes to this.
```
if (pickedImage == "")
{
    context.Response.ContentType = "text/plain";
    context.Response.Write("");
}
else
{
    ImageCacher imageCacher = new ImageCacher(pickedImage);

    byte[] byteArray = imageCacher.GetImage();
    context.Response.BinaryWrite(byteArray);
}
```

And that's It! You can now run the application and it will now cache the image itself, not just the filenames.

### Brief Explanation
The ImageCacher class is really no different than any other cacher that I have done previously. That is, check if cache exists, if it doesn't then build it. If it does then just use what's in the cache, as in,
```
if (m_imageObject == null)
{              
    // Build cache
}
return m_imageObject.Content;
```

#### About ImageObject
So, first I will explain the ImageObject class. Again, here it is,
```
public class ImageObject
{
    public string FileName { get; set; }
    public string ContentType { get; set; }
    public byte[] Content { get; set; }
    public DateTime SubmitDate { get; set; }

    public ImageObject(string fn, string tp, byte[] ct, DateTime dt)
    {
        FileName = fn;
        ContentType = tp;
        Content = ct;
        SubmitDate = new DateTime(dt.Year, dt.Month, dt.Day, dt.Hour, dt.Minute, dt.Second, 0, DateTimeKind.Utc);
    }

}
```
The class members are, pretty much self-explanatory. It has to have a **Filename**, which is the image path. For the **ContentType** and for this demo, I'm just hard-coding the content type to "image/jpeg". The **Content** is the actual image stored as array of bytes, and this is what we pass back to the browser. The **SubmitDate** is the last modification of the file. Finally, you need to pass all these info to the constructor. 

You can see below how the ImageCacher figured out all these information. The date was from the ```GetLastWriteTime``` method of the ```File``` object. And, the content is from ```ReadAllBytes``` method of the ```File``` object.

#### About ImageCacher
Now, going back to the ImageCacher, let's take a look again at the GetImage() method.
```
public byte[] GetImage()
{
    if (m_imageObject == null)
    {              
        DateTime ourFileDate = File.GetLastWriteTime(m_pickedImagePath);
        ourFileDate = ourFileDate.AddMilliseconds(-ourFileDate.Millisecond);

        byte[] byteArray = File.ReadAllBytes(m_pickedImagePath);
        m_imageObject = new ImageObject(m_pickedImagePath, "image/jpeg", byteArray, ourFileDate);
        HttpRuntime.Cache.Insert(m_pickedImagePath, m_imageObject, null, System.Web.Caching.Cache.NoAbsoluteExpiration, System.Web.Caching.Cache.NoSlidingExpiration);               
    }
                
    return m_imageObject.Content;
}
```
You can see that as soon as we read the bytes array,
```
byte[] byteArray = File.ReadAllBytes(m_pickedImagePath);
```
we, then, pass this byteArray to the constructor of our ImageObject, together with the file path, content type, and its date,
```
m_imageObject = new ImageObject(m_pickedImagePath, "image/jpeg", byteArray, ourFileDate);
```
Then, we immediately cache it! The cache name or identifier is the path of the filename. If the cache already exists, then just return the cache. 

### And That's It!
I hope it helps a little with your projects!



[project-download]: https://github.com/avasay/ImageRandomizer

[tccd-site]: https://www.tccd.edu/

[get-random-element]: /dotnet/csharp/2019/10/31/Get-Random-Element-From-Cached-List.html

[display-image]: /dotnet/csharp/2019/10/31/Display-Image-Using-Csharp-Generic-Handler-And-Jquery.html

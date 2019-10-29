---
layout: post
title:  "Image Randomizer using C# Caching"
date:   2019-10-29 08:10:00 -0500
categories: Razor Caching csharp
tags: [image rotator]
---

This is a simple image randomizer/rotator demo implemented in C# and using generic handler. Basically, the application works by reading all the filenames contained in a user-given directory and caching the filenames. Whenever the browser is refreshed, application simply picks a random filename from the cache instead of going to the file system. 

This application is very similar to websites that rotate their hero banner on their homepage. Imagine a college website that offers courses in Biology, Math, and Physics. The Biology homepage, for example, will have a rotating banners in which the banners are Biology-related only. Math has its own homepage and its own rotating banner images are Mathc-related only. And so on.

The application is a C# generic handler that the user calls within Razor page. The handler  returns the image as bytearray. Also, the handler is called within the background style, which in turn setts the background to that image.   

```
    <div style="background: url('GetImageHandler.ashx?subject=biology');"></div>
```

Note: **subject=biology** querystring is how caller tells handler it wants images from biology directory.  

In Visual Studio, I created a ASP.NET (Framework) project, and organized my folders like this.

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/48981440187/in/dateposted-public/" title="Studio-Banner-1"><img src="https://live.staticflickr.com/65535/48981440187_b0dcf40de2_w.jpg" width="auto" height="auto" alt="Studio-Banner-1"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

Also, create two other items: the generic handler called *GetImageHandler.ashx* and the Razor page called *index.cshtml* (as shown).

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
## The Generic Handler

The code listing for the generic handler code-behind, *GetImageHandler.ashx.cs*, is shown below:
```
public class GetImageHandler : IHttpHandler
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
                byte[] byteArray = File.ReadAllBytes(pickedImage);
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

        private string BuildCache(string path)
        {
            // Get a list of files from the given path
            var extensions = new string[] { ".png", ".jpg", ".gif" };
            var dirInfo = new DirectoryInfo(path);

            if (!dirInfo.Exists)
            {
                return "";
            }

            List<System.IO.FileInfo> rgFiles = dirInfo.GetFiles("*.*").Where(f => extensions.Contains(f.Extension.ToLower())).ToList();

            if (rgFiles.Count() != 0)
            {
                // Pick random file
                Random R = new Random();
                string imagePath = string.Empty;
                int randomNumber = R.Next(0, rgFiles.Count());
                imagePath = rgFiles.ElementAt(randomNumber).FullName;

                // Now, put all files in the Dictionary
                List<string> fileInfo2string = rgFiles.Select(f => f.FullName.ToString()).ToList();
                HttpRuntime.Cache.Insert(path, fileInfo2string, null, DateTime.Now.AddMinutes(1d), System.Web.Caching.Cache.NoSlidingExpiration);
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
```
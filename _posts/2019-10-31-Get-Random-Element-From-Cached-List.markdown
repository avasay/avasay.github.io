---
layout: post
title:  "Get Random Element From Cached C# List<T>"
date:   2019-10-31 10:10:00 -0500
categories: dotnet csharp
tags: List Random Files Image Caching
---

#### Project Type: Web Application, Generic Handler
#### Main Topic: HttpRuntime Cache
#### Possible application: Image Caching

This is an extension of the previous post [Get Random Element From C# List][get-random-element] in which I retrieve a random element from ```List<T>```. This time, though, I will cache the list, and retrieve a random element from the cache, and made sure that on browser refresh the element is retrieved from the cache and not from the list. And this time, instead of a Console project, I will use a Web Application project and a Generic Handler(.ashx file), similar to what I did in my previous post [Display Image as ByteArray Using C# Generic Handler and JQuery][display-image-jquery]. Check out that post to see how to set up ASP.NET Web Application project and Generic Handler.

Caching a generic collection in .NET is vcommonly mostly used for image processing. For this simple demo though, I will simply cache a hardcoded list, just to show how I do it using ```System.Web.HttpRuntime.Cache``` (In my future post, I will show how to use this list to store info from the file system, cache the list, and use this cache to display random images to the browser). 

## Application Output
When I run my program, I call Handler.ashx directly in my browser. And, this is what I get.

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/48991802768/in/dateposted-public/" title="random-cache-1"><img src="https://live.staticflickr.com/65535/48991802768_f1a31dc5c5_n.jpg" width="640" height="auto" alt="random-cache-1"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>


On Refresh, I may get the same image again. Or I may get a different one. This is because I only have three things to choose from. For a list with hundreds of elements, I may get a different one everytime.

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/48991802748/in/dateposted-public/" title="random-cache-2"><img src="https://live.staticflickr.com/65535/48991802748_416cd811b7_n.jpg" width="640" height="auto" alt="random-cache-2"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>


#### Program Setup
In Visual Studio, create the following: 
1. **A web application**, *ASP.NET Web Application (.NET Framework)*. I called my application, *GetRandomCaching*.
2. **A generic handler**, and simply call it *Handler.ashx*. 
3. **A class** called *DirInfoCacher.cs* - this one is not necessary though. I just wanted the caching logic separate from the handler.

My project looks like this.

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/48992644797/in/dateposted-public/" title="random-cache-3"><img src="https://live.staticflickr.com/65535/48992644797_8357e7fa01_n.jpg" width="320" height="290" alt="random-cache-3"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

___
## The Handler
My handler is simple:
```
public class Handler1 : IHttpHandler
{

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "text/plain";
        
        DirInfoCacher infoCacher = new DirInfoCacher();

        string randomEl = infoCacher.GetRandom();

        context.Response.Write(randomEl);
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

### Brief Explanation
First, I declare that I'll be returning a plain text to the browser as my response,
```
context.Response.ContentType = "text/plain";
```
I instantiate my DirInfoCacher class, like so,
```
DirInfoCacher infoCacher = new DirInfoCacher();
```
and calls a method called GetRandom() 
```
string randomEl = infoCacher.GetRandom();
```
which returns a string. I, then, send that string out to the browser.


___
## The DirInfoCacher class
My main logic is in the DirInfoCacher.cs and it looks like this,
```
public class DirInfoCacher
{
    public DirInfoCacher()
    {
    }

    public string GetRandom()
    {
        object cacheList = HttpRuntime.Cache.Get("biology") as List<string>;
        string returnedString = string.Empty;

        if (cacheList == null)
        {
            // Initialize our list
            List<string> myList = new List<string>(new string[] { "biology-1", "biology-2", "biology-3" });

            // Cache the 
            HttpRuntime.Cache.Insert("biology", myList, null, DateTime.Now.AddMinutes(60d), System.Web.Caching.Cache.NoSlidingExpiration);

            Random R = new Random();

            // get random number from 0 to 2. 
            int someRandomNumber = R.Next(0, myList.Count());
            returnedString = myList.ElementAt(someRandomNumber);
            return returnedString;
        }
        else
        {
            IList<string> objectCache = (IList<string>)cacheList;

            Random R = new Random();

            // get random number from 0 to 2. 
            int someRandomNumber = R.Next(0, objectCache.Count());

            returnedString = objectCache.ElementAt(someRandomNumber);

            return returnedString;
        }

    }
}
```

### Brief Explanation

Notice that it is divided into two major logical parts. 
```
if(cacheList == null)
{
    // Build the cache & get a random string from the list
    // return the string
}
else
{
    // Get a random string from the cache
    // return the string
}

```
First part builds the cache when the application is run for the first time. The second part just reads from the cache. 

As you may have thought, the first part is called only once - the first time we run the application. On refresh, we always execute the second part.

The following code retrieves the cache named "biology" if it exists,
```
object cacheList = HttpRuntime.Cache.Get("biology") as List<string>;
```

If cache does not exist, then initialize the list.
```
List<string> myList = new List<string>(new string[] { "biology-1", "biology-2", "biology-3" });
```

Then, I cache the list soon after that using HttpRuntime.Cache.Insert method.
```
HttpRuntime.Cache.Insert("biology", myList, null, DateTime.Now.AddMinutes(60d), System.Web.Caching.Cache.NoSlidingExpiration);
```
In the snippet above, I am creating a cache and naming it as "biology". Then, I pass my list object to it. I also tell it that my cache expires in 60 minutes(absoluteExpiration). Note that if you specified an absolute expiration, the last parameter must be NoSlidingExpiration. The code below produces a random element from the list(same code I used from my old [post][get-random-element]).
```
Random R = new Random();               
int someRandomNumber = R.Next(0, myList.Count());
returnedString = myList.ElementAt(someRandomNumber);
```

On refresh, because the cache object already exists, the code executes the **else** part. Then we just read our cache like so, 
```
IList<string> objectCache = (IList<string>)cacheList;
```
we now cast it as ```IList<string>``` because we created it previously as ```object``` type, to enable us to process it as a list. Then, as we did previously we just need to get a random element from that list, like so,
```
Random R = new Random();         
int someRandomNumber = R.Next(0, objectCache.Count());
returnedString = objectCache.ElementAt(someRandomNumber);
return returnedString;
```

### And that's it!
I hope it helps you somehow in your projects.


[get-random-element]: /dotnet/csharp/2019/10/30/Get-Random-Item-From-Csharp-List.html

[display-image-jquery]: /dotnet/csharp/2019/10/31/Display-Image-Using-Csharp-Generic-Handler-And-Jquery.html
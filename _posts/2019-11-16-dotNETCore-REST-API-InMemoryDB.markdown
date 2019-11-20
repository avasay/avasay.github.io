---
layout: post
title:  "ASP.NET Core REST API using InMemory Database"
date:   2019-11-16 08:10:00 -0500
categories: dotnet core csharp
tags: rest api
comments: true
published: true
---

Don't you sometimes just want to use a dummy database? That is, without actually going through the hassle of building one in your local drive? In this post, I show you how to build a simple **REST API** in ASP.NET Core 2.0 **plus** how to use an **InMemory Database** to store your data.  <!--more--> 

In my work, we use a lot of third-party API services that we need to get our website working, and I always find myself needing to simulate these services first in my local machine. And I always rely on quick in-memory database that goes away after I'm done using it.

For this demo, I will create a simple *Employee* database. I will create an ASP.NET Core Web API project in Visual Studio Community(2019). And I will test three services: GET, GET{by id}, and POST. The first GET/ service gets all employees, GET/{id} get an employee by Id, and POST/ creates an employee.

I'm using a browser-based REST client plugin for Chrome to test my API --- called **Boomerang**. There are dozens of REST client plugins for various browsers, but this is the best plugin to me and the easiest. You also use your own client to test this. 

___
## Demo

The REST client looks like this in Chrome. You enter the URL in the URL box of the client. And you use the dropdown box to choose what you want to do. 

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49075015572/in/dateposted-public/" title="webapi-5"><img src="https://live.staticflickr.com/65535/49075015572_cfd79e0dda_n.jpg" width="100%" height="auto" alt="webapi-5"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

In the above example, if we want to **GET** all employees, we enter *https://localhost:44391/api/v1/Employees* in the URL box, and choose GET from the dropdown box. Because we have an empty database first, we'll get an empty response. 

To create an employee, we select **POST** in the dropdown box, and enter a json data in the body, like this:

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49074808391/in/dateposted-public/" title="webapi-6"><img src="https://live.staticflickr.com/65535/49074808391_b82964da83_n.jpg" width="100%" height="auto" alt="webapi-6"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

After we hit Send, we get a **Success 201** response from the service, like this:

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49074277918/in/dateposted-public/" title="webapi-7"><img src="https://live.staticflickr.com/65535/49074277918_812250f6fb_n.jpg" width="100%" height="auto" alt="webapi-7"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

*201* response means the request has was successfully executed, and a new resource has been created. Notice that included the json data as part of the response.

Let's post another employee. And after we hit send, we get another *Success 201* message, as illustrated below.

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49074277853/in/dateposted-public/" title="webapi-10"><img src="https://live.staticflickr.com/65535/49074277853_d79aa7cd54_n.jpg" width="100%" height="auto" alt="webapi-10"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

To test the Get{by id} method, we just select GET in the dropdown box, and append the employee number at the end of the URL, as illustrated below:

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49075015422/in/dateposted-public/" title="webapi-12"><img src="https://live.staticflickr.com/65535/49075015422_923b33cab7_n.jpg" width="100%" height="auto" alt="webapi-12"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

For the above example, I wanted to get employee with an Id of **2**. After we hit Send, we get **Success 200**. 


### Project Setup

In Visual Studio (mine was Community 2019), create an ASP.NET Core Web Application project, as illustrated below:

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49074454778/in/dateposted-public/" title="webapi-13"><img src="https://live.staticflickr.com/65535/49074454778_68a9c71cc7_n.jpg" width="100%" height="auto" alt="webapi-13"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

I called my project **WebAPIInMemoryDB**. Choose **API** when prompted for a template, as shown below:

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49075193007/in/dateposted-public/" title="webapi-14"><img src="https://live.staticflickr.com/65535/49075193007_b5e7016d4e_n.jpg" width="100%" height="auto" alt="webapi-14"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

After you finished creating your project, a controller is created for you called **ValuesController**, and you can run the program immediately. In my case, I added the following:
* I created Models folder, then under this, I created
    * Employee.cs
    * EmployeeDBContext.cs
* In Controllers folder, I created
    * EmployeesController.cs

My final project looks like this:

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49074454758/in/dateposted-public/" title="webapi-15"><img src="https://live.staticflickr.com/65535/49074454758_4c71be9ece_o.jpg" width="287" height="280" alt="webapi-15"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

### Employee
The first thing to do is create an Employee class which will represent our employee table in our database. 

```
namespace WebAPIInMemoryDB.Models
{
    public class Employee
    {
        public int Id { get; set; }

        [Required]
        public string fName { get; set; }

        [Required]
        public string lName { get; set; }

        public int age { get; set; }

        public string address { get; set; }

        public string city { get; set; }

        public string state { get; set; }

        public string zipcode { get; set; }

    }
}
```

You don't need to add DataAnnotations(```[Required]```) like I did. 

### EmployeeDBContext

While Employee class represents our table, EmployeeeDBContext represents our database.

```
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebAPIInMemoryDB.Models
{
    public class EmployeeDBContext : DbContext
    {
        public DbSet<Employee> Employees { get; set; }

        public EmployeeDBContext(DbContextOptions<EmployeeDBContext> options)
            : base(options)
        {

        }
    }
}
```

As you can see, it is very simple. First we declare a collection of Employees to represent rows of Employees in our database, using ```DbSet```.

Secondly, we pass a ```DbContextOptions``` object to our DBContext base. This is important. The options, as you will see later, is set as **UseInMemoryDatabase**, so that we can use the memory for our database.


### Configure to Use InMemory Database on Startup
The next thing that we need to do is add a DBContext service in our Startup.cs file. Look for the following method:

```
public void ConfigureServices(IServiceCollection services)
{
    services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_1);
}
```
And change it to:
```
public void ConfigureServices(IServiceCollection services)
{
    services.AddDbContext<EmployeeDBContext>(options => options.UseInMemoryDatabase("Employees"));

    services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_1);
}
```
As you can see, we added ```services.AddDBContext``` with the option to use InMemory database. The name of the database is trivial. I choose to name my database ```"Employees"``` but you can call it anything. Also, make sure you have this namespace:
```
using Microsoft.EntityFrameworkCore;
```
This is all you need to configure your application to use InMemory database! Next, we talk about the controller and how we implement our GETs and POST methods.

### EmployeesController

To create EmployeesController class, right-click on the **Controllers** folder. Select **Add** >> **Controller**. In the **Add Scaffold** window, choose **API Controller with actions, using Entity Framework**, as illustrated below:

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49075386732/in/dateposted-public/" title="webapi-2"><img src="https://live.staticflickr.com/65535/49075386732_51be606235_o.jpg" width="100%" height="auto" alt="webapi-2"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

Then, we choose our Employee and EmployeeDBContext classes in the next window, as shown below:

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49075177891/in/dateposted-public/" title="webapi-1"><img src="https://live.staticflickr.com/65535/49075177891_9e642128fa_o.jpg" width="586" height="210" alt="webapi-1"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

After you click the **Add** button, it will create EmployeesController class for you. 

### Optional: Change Route in Controller
Honestly, I didn't have to change anything in EmployeesController after it was created. Visual Studio did a perfect job creating this scaffolding. The only thing I needed to change was my *routing*. Note the ```[Route]``` annotation above the class,

```
[Route("api/[controller]")]
```
I changed it to
```
[Route("api/v1/[controller]")]
```
in case you anticipate a newer version of your API in the future. Otherwise, don't change the routing if you don't care.

### Optional: Change Default Launch URL
To make your project run the Employees URL by default instead of Values, change your **launchSettings.json** (in Properties folder). You only need to change the ```"launchUrl"``` value. So, look for that key and change it to

```
"launchUrl": "api/v1/Employees",
```

### Run Your Program
Run the program. Open your REST client (e.g., Boomerang), and enter your URL, as illustrated below (obviously, your localhost URL will have a different port than mine). Choose **GET** in the dropdown, and hit **Send**.

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49090614256/in/dateposted-public/" title="webapi-16"><img src="https://live.staticflickr.com/65535/49090614256_eb85cced0c_o.jpg" width="100%" height="auto" alt="webapi-16"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

 If everything went well, you should get a **SUCCESS 200** response. Experiment with a POST request using any of the following JSON data. And doing a **GET** request afterwards. Good Luck!

 ```
{
    "id": 1,
    "fName": "David",
    "lName": "Bowie",
    "age": 81,
    "address": "123 Main St",
    "city": "Hollywood",
    "state": "CA",
    "zipcode": "33019"
},
{
    "id": 2,
    "fName": "Madonna",
    "lName": "Ciccone",
    "age": 61,
    "address": "332 Market St",
    "city": "Detroit",
    "state": "MI",
    "zipcode": "48201"
},
{
    "id": 3,
    "fName": "Cyndi",
    "lName": "Lauper",
    "age": 67,
    "address": "111 George St",
    "city": "Brooklyn",
    "state": "NY",
    "zipcode": "11207"
},
{
    "id": 4,
    "fName": "Justin",
    "lName": "Bieber",
    "age": 21,
    "address": "345 Cleveland St",
    "city": "Miami",
    "state": "FL",
    "zipcode": "33101"
}
 ```

___
## That's it, Folks!
I hope it works on your side, and I hope it helps you a little. In my next demo, I will talk about how to initialize or seed our InMemory database instead of doing POST request to create the initial data.


### Source Code
Download source code **[here][project-download]**. This project was created using Visual Studio Community 2019.

[project-download]: https://github.com/avasay/WebAPI.git





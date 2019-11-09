---
layout: post
title:  "Role-Based Windows Authentication with .NET MVC"
date:   2019-11-06 08:10:00 -0500
categories: dotnet csharp
tags: windows authentication MVC
comments: true
published: true
---

This is a demo of Windows Authentication implemented in .NET MVC and is similar to what I did for an internal site in our organization. <!--more--> 

I needed to re-implement a legacy application. This application had *hard-coded* individual users in the ```Authorize``` attribute of the controller. Unfortunately, because it was deployed as a binary DLL, and the original source code was nowhere to be found, adding new users is impossible. Luckily, our application was a simple Windows Authentication that uses the already existing Active Directory (AD), no SQL membership nor any custom role provider.

In a nutshell, authenticated users need to log in order to manage school programs and enrollees to these programs. This application has one component --- a public-facing page --- where the public can enroll to a program. For the purpose of demonstration, I'm referring to the public page **Enroll**, and the secure page **Manage**. 

### Application Output
When you run the application, you will be shown by the default .NET MVC application. One of the menu options was *Manage* which only authenticated users can access.

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49039818877/in/dateposted-public/" title="auth-1"><img src="https://live.staticflickr.com/65535/49039818877_91ed53e867_n.jpg" width="640" height="auto" alt="auth-1"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

After clicking on *Manage*, you will be asked to authenticate.

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49039765087/in/dateposted-public/" title="auth-2"><img src="https://live.staticflickr.com/65535/49039765087_df08ae6611_n.jpg" width="640" height="auto" alt="auth-2"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

If authenticated successfully, you can access the secure pages. Otherwise, you'll get an authentication error page. In my case, I created my own, so that it looks more professional.

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49039109443/in/dateposted-public/" title="auth-3"><img src="https://live.staticflickr.com/65535/49039109443_2ce051fa09_n.jpg" width="640" height="auto" alt="auth-3"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>


### Quick Overview

To quickly summarize what I did, these are the things I needed to do to get the authentication to work.

* Added in web.config
    * **LDAP** connection string
    * **membership** provider
    * **role** provider
* Added ```Authorize``` attribute in ```ManageController```class. Placing the ```Authorize``` attribute above the class will restrict access to the all ManageController's actions (e.g., Index, Create, Read, Update, Delete, and all custom methods). You may also restrict just specific actions by putting the ```Authorize``` attribute above those actions.
* Lastly, in IIS, I enabled both **Windows Authentication** and **Anonymous Authentication**.
* Minor detail, but still important to mention --- if you're doing this on Visual Studio, you need to run it **as administrator**.

___
## Web.config

The web.config is where most of the Windows authentication implementation happens (in fact, I was pleasantly surprised that I only needed to do one thing inside my actual code). I'm not going to show you the full content of my web.config, but just the most important things, and these are:

```
<configuration>

<connectionStrings>
    <add name="ADService" connectionString="LDAP://AVASAY.ldapServer" />
</connectionStrings>

<authentication mode="Windows" />

<system.web>
    <membership defaultProvider="AspNetActiveDirectoryMembershipProvider">
        <providers>
        <add name="AspNetActiveDirectoryMembershipProvider" 
            type="System.Web.Security.ActiveDirectoryMembershipProvider, System.Web, Version=4.0.0.0 Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a" 
            attributeMapUsername="sAMAccountName"
            connectionStringName="ADService" 
            passwordAttemptWindow="10" applicationName="/" 
            connectionUsername="xxxxxxxx" 
            connectionPassword="xxxxxxxxxx" />
        </providers>
    </membership>
</system.web>
<roleManager defaultProvider="WindowsProvider" enabled="true" cacheRolesInCookie="false">
    <providers>
        <add name="WindowsProvider" type="System.Web.Security.WindowsTokenRoleProvider" />
    </providers>
</roleManager>

<configuration>
```
As you can see, the most important elements in web.config are: 
* ```<connectionStrings>```, 
* ```<authentication mode="Windows" />```
* ```<membership defaultProvider>```, and 
* ```<roleManage defaultProvider>```.

### Brief Explanation
The connection string tells the system where your active directory is:
```
<connectionStrings>
    <add name="ADService" connectionString="LDAP://AVASAY.NET/DC=tccdweb,DC=net" />
</connectionStrings>
```
Obviously, this is not our actual LDAP URL. But in these example, AVASAY is the domain or domain controller, and the rest of the string is pretty much how you would organize the URL.

**Important Note**: To test successfully, the application server/machine must be a member of that domain. For example, in my local machine where I'm testing the application, I'm logged in as AVASAY\alejandrio.vasay.  

The next line is self-explanatory.
```
<authentication mode="Windows" />
```
And that's it! **I DID NOT need** an ```<authorization>``` tag like this:
```
<authorization>
    <allow roles="AVASAY\ProgramManager" />
    <deny users="?" />
</authorization>
```
In my MVC application, I authorized roles inside my controller, which I will explain later. In fact, having authorization tag in web. config and not in my controller did not work for me. 

The next node, ```membership```, 
```
<membership defaultProvider="AspNetActiveDirectoryMembershipProvider">
```
and everything within ```<providers>``` is what connects our app to the domain controller. The most important key-values are:
* ```attributeMapUsername="sAMAccountName"``` --- this says that we are using usernames without the @domain part(normally, an email address). If you don't want to use *sAMAccountName*, you can use *userPrinciplaName* which uses the @domain part.
* ```connectionStringName="ADService"``` --- the ADService was the LDAP connection string from earlier.
* ```connectionUsername="xxxxxxxx" connectionPassword="xxxxxxxxxx" />``` --- the username/password is needed to gain entry into AD.

Next is ```roleManager``` in which you specify the role provider,
```
<providers>
    <add name="WindowsProvider" type="System.Web.Security.WindowsTokenRoleProvider" />
</providers>
``` 
This is the default Windows role provider. Use this if you're not using any custom role provider or any SQL membership. Use this if you created the role in the same AD that you specified in our ```<membership>``` section. In our theoretical example, the domain, *AVASAY*, contains the AD, and in that AD, you create a Role called *ProgramManager*. To test your application successfuly in your local machine, you need to be a member of the *ProgramManager* role. 

**Important Note:** I have never been able to test successfully across domains --- that is, test against an AD in a domain that is different from the domain in which the application is running in. Even when the two domains have a *Trust* relationship. 
But, let me know if you've been able to test across domains.

___
## Controller
The next thing I need to do is add an ```Authorize``` attribute to my controller. My ManageController class, for example, looks like this:
```
[Authorize(Roles = "AVASAY\\ProgramManager")]
public class ManageController : Controller
{
    public ActionResult Index()
    {
        return View();
    }
}
```
By placing the ```Authorize``` attribute above the class, I'm restricting the all ManageController actions to only the members of *ProgramManager* role. This means that if a user access a URL that precedes by */Manager/*, like this:
```
http://localhost/WindowsAuthTccdWebMvc1/Manage/
```

or

```
http://localhost/WindowsAuthTccdWebMvc1/Manage/Edit
```
then, you will be asked to authenticate. **That's it for my controller!** 

___
## IIS
Finally, you need to enable at least Windows Authentication in IIS Manager.

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/49039859577/in/dateposted-public/" title="auth-4"><img src="https://live.staticflickr.com/65535/49039859577_59095b517e_n.jpg" width="640" height="auto" alt="auth-4"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>














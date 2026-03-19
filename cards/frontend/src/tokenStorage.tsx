export function storeToken( tok:any ) : any
{
    try
    {
        const tokenValue = typeof tok === 'string' ? tok : tok?.accessToken;
        if (typeof tokenValue === 'string' && tokenValue.length > 0)
        {
            localStorage.setItem('token_data', tokenValue);
        }
    }
    catch(e)
    {
        console.log(e);
    }
}

export function retrieveToken() : any
{
    var ud;
    try
    {
        ud = localStorage.getItem('token_data');
    }
    catch(e)
    {
        console.log(e);
    }
    return ud;
}
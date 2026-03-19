const app_name = '64.225.28.128'

export function buildPath(route: string): string {
    if (import.meta.env.MODE !== 'development') {
        return 'http://' + app_name + ':5000/' + route;
    } else {
        return 'http://localhost:5000/' + route;
    }
}
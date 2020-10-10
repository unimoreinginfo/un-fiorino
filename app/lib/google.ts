import {
    readFileSync
} from 'fs-extra'

export default{

    credentials: JSON.parse(readFileSync('./credentials.json').toString('utf-8'))

}
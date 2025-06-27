import { CircularProgress } from "@material-ui/core"

interface IProps {
    message: string;
}
export const Loader = (props: IProps) => {
    return(
    <div
        style={{
            justifyContent:'center',
            fontWeight: 'bold',
            fontSize:'1rem',
            textAlign:'center'
        }}
    >
        <CircularProgress size='1rem'/>{props.message}...
    </div>
    )
}
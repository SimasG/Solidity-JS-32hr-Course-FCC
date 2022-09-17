export default function User(props: any) {
  const name: string = props.name;
  document.title = name;
  // This is a side effect. Don't do this in the component body!

  return <h1>{name}</h1>;
}

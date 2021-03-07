import os
import dash
import dash_html_components as html
import dash_core_components as dcc
import dash_bootstrap_components as dbc
import dash_daq as daq
import plotly.graph_objects as go
import pandas as pd
import dash_split_pane
from dash.dependencies import Input, Output, State


external_stylesheets=["assets/template.css", "assets/bootstrap.min.css"]
# Load data
df = pd.read_csv('data/stockdata2.csv', index_col=0, parse_dates=True)
df.index = pd.to_datetime(df['Date'])

# Initialize the app
app =dash.Dash(__name__,external_stylesheets=external_stylesheets)
app.title = 'Diaforá'
app._favicon 
server = app.server
app.config.suppress_callback_exceptions = True


def get_options(list_stocks):
    dict_list = []
    for i in list_stocks:
        dict_list.append({'label': i, 'value': i})

    return dict_list

PLOTLY_LOGO = "assets/DiaforaIcon.png"
splitColor = "#C700BA"
mergeColor = "#FFA452"
movedColor = "#09D3D3"
renamedColor = "#1700E7"
addedColor = "#38B03D"
excludedColor = "#D50000"

search_bar = dbc.Row(
    [
        dbc.Col(dbc.Input(type="search", placeholder="Search")),
        dbc.Col(
            dbc.Button("Search", color="primary", className="ml-3"),
            width="auto",
        ),
    ],
    no_gutters=True,
    className="ml-auto flex-nowrap mt-3 mt-md-0",
    align="center",
)

splitSwitch = daq.BooleanSwitch(
        id = 'split-switch',
        label={
            'label': 'Split',
            'style': {
                'color': 'white'
            }
        },
        labelPosition='top',
        color=  splitColor,
        className = "toggle-switch",
        )
mergeSwitch = daq.BooleanSwitch(
        id = 'merge-switch',
        label={
            'label': 'Merge',
            'style': {
                'color': 'white'
            }
        },
        labelPosition='top',
        color=  mergeColor,
        className = "toggle-switch",
        )
movedSwitch =  daq.BooleanSwitch(
        id = 'moved-switch',
        label={
            'label': 'Moved',
            'style': {
                'color': 'white'
            }
        },
        labelPosition='top',
        color=  movedColor,
        className = "toggle-switch",
        )
renamedSwitch = daq.BooleanSwitch(
        id = 'renamed-switch',
        label={
            'label': 'Renamed',
            'style': {
                'color': 'white'
            }
        },
        labelPosition='top',
        color=  renamedColor,
        className = "toggle-switch",
        )
addedSwitch = daq.BooleanSwitch(
        id = 'added-switch',
        label={
            'label': 'Added',
            'style': {
                'color': 'white'
            }
        },
        labelPosition='top',
        color=  addedColor,
        className = "toggle-switch",
        )
excludedSwitch = daq.BooleanSwitch(
        id = 'excluded-switch',
        label={
            'label': 'Excluded',
            'style': {
                'color': 'white'
            }
        },
        labelPosition='top',
        color=  excludedColor,
        className = "toggle-switch",
        )
navbar = dbc.Navbar(
    [
        html.A(
            # Use row and col to control vertical alignment of logo / brand
            dbc.Row(
                [
                    dbc.Col(html.Img(src=PLOTLY_LOGO, height="30px")),
                    dbc.Col(dbc.NavbarBrand("Diaforá", style={
                        "font-size": "2.0rem"
                        }, className="mb-0 h1 ml-2")),
                ],
                align="center",
                no_gutters=True,
            ),
            href="#",
        ),
        dbc.NavbarToggler(id="navbar-toggler"),
        dbc.Collapse(
               dbc.Nav(
                    [splitSwitch, mergeSwitch, movedSwitch,renamedSwitch,addedSwitch,
                     excludedSwitch], className="ml-auto", navbar=True
                ),
                id="navbar-collapse",
                navbar=True,
           ),
    ],
    color="dark",
    dark=True,
)
app.layout = html.Div(
    children=[navbar,
        html.Div(className='row',
                 children=[
                     dash_split_pane.DashSplitPane(
                            children=[html.Div(className=' div-user-controls',
                             children=[
                                 html.H2('DASH - STOCK PRICES'),
                                 html.P('Visualising time series with Plotly - Dash.'),
                                 html.P('Pick one or more stocks from the dropdown below.'),
                                 html.Div(
                                     className='div-for-dropdown',
                                     children=[
                                         dcc.Dropdown(id='stockselector', options=get_options(df['stock'].unique()),
                                                      multi=True, value=[df['stock'].sort_values()[0]],
                                                      style={'backgroundColor': '#1E1E1E'},
                                                      className='stockselector'
                                                      ),
                        
                                        daq.ToggleSwitch(
                                                id='my-toggle-switch',
                                                value=False,
                                                label={
                                                    'label': 'Merge',
                                                    'style': {
                                                        'color': 'white',
                                                        'background-color':'red'
                                                    }
                                                },
                                                labelPosition='bottom',
                                                color=  'red'
                                            ),           
                                     ],
                                     style={'color': '#1E1E1E'})
                                ]
                             ), 
                            html.Div(className=' div-for-charts bg-grey',
                             children=[

                                 dcc.Graph(id='timeseries',className="div-card", config={'displayModeBar': False}, animate=True)

                             ])],
                                    id="splitter",
                                    split="vertical",
                                    size=450,
                                ),
                    

        ]

)])

def toggle_navbar_collapse(n, is_open):
    if n:
        return not is_open
    return is_open

app.callback(
        Output("navbar-collapse", "is_open"),
        [Input("navbar-toggler", "n_clicks")],
        [State("navbar-collapse", "is_open")],
    )(toggle_navbar_collapse)

# Callback for timeseries price
@app.callback(Output('timeseries', 'figure'),
              [Input('stockselector', 'value')])
def update_graph(selected_dropdown_value):
    trace1 = []
    df_sub = df
    for stock in selected_dropdown_value:
        trace1.append(go.Scatter(x=df_sub[df_sub['stock'] == stock].index,
                                 y=df_sub[df_sub['stock'] == stock]['value'],
                                 mode='lines',
                                 opacity=0.7,
                                 name=stock,
                                 textposition='bottom center'))
    traces = [trace1]
    data = [val for sublist in traces for val in sublist]
    figure = {'data': data,
              'layout': go.Layout(
                  colorway=["#5E0DAC", '#FF4F00', '#375CB1', '#FF7400', '#FFF400', '#FF0056'],
                  template='plotly_dark',
                  paper_bgcolor='rgba(0, 0, 0, 0)',
                  plot_bgcolor='rgba(0, 0, 0, 0)',
                  margin={'b': 15},
                  hovermode='x',
                  autosize=True,
                  title={'text': 'Stock Prices', 'font': {'color': 'white'}, 'x': 0.5},
                  xaxis={'range': [df_sub.index.min(), df_sub.index.max()]},
              ),

              }

    return figure

@app.callback(Output('merge-switch', 'on'), 
            Input('split-switch', 'on'))
def fn(input_prop):
    return input_prop


if __name__ == '__main__':
    app.run_server(debug=True)
